const {BigNumber} = require('bignumber.js');
const {Universal, Node, MemoryAccount} = require('@aeternity/aepp-sdk');
const fs = require('fs');
const Util = require('../utils/util');

class Aeternity {
  constructor() {
    this.init();
  }

  init = async () => {
    if (!this.client) {
      this.client = await Universal({
        nodes: [
          {
            name: 'mainnetNode',
            instance: await Node({
              url: process.env.NODE_URL,
              internalUrl: process.env.NODE_URL,
            }),
          }],
        accounts: [
          MemoryAccount({keypair: {secretKey: process.env.PRIVATE_KEY, publicKey: process.env.PUBLIC_KEY}}),
        ],
        address: process.env.PUBLIC_KEY,
        compilerUrl: process.env.COMPILER_URL,
      });
      this.contract = await this.client.getContractInstance(this.getContractSource(), {contractAddress: process.env.CONTRACT_ADDRESS});
      this.oracleContract = await this.client.getContractInstance(this.getOracleContractSource(), {contractAddress: "ct_2VpQ1QGXy7KA2rsQmC4QraFKwQam3Ksqq3cAK8KHUNwhoiQkL"});
    }
  };

  setCache = (cache) => {
    this.cache = cache;
  };

  networkId = async () => {
    return (await this.client.getNodeInfo()).nodeNetworkId
  };

  getTips = async () => {
    if (!this.client) throw new Error('Init sdk first');
    const fetchTips = async () => {
      const state = await this.contract.methods.get_state();
      return this.getTipsRetips(state.decodedResult);
    };

    return this.cache ? this.cache.getOrSet(["getTips"], () => fetchTips(), this.cache.shortCacheTime) : fetchTips();
  };

  getContractSource = () => {
    if (!process.env.CONTRACT_FILE) throw new Error(`env.CONTRACT_FILE is ${process.env.CONTRACT_FILE}`);
    return fs.readFileSync(`${__dirname}/${process.env.CONTRACT_FILE}.aes`, 'utf-8');
  };

  getOracleContractSource = () => {
    return fs.readFileSync(`${__dirname}/OracleServiceInterface.aes`, 'utf-8');
  };

  async preClaim(address, url) {
    const claimAmount = await this.contract.methods.unclaimed_for_url(url).then(r => r.decodedResult).catch(() => 0);
    if (claimAmount === 0) throw new Error("No zero amount claims");

    // pre-claim if necessary (if not already claimed successfully)
    const claimSuccess = await this.contract.methods.check_claim(url, address).then(r => r.decodedResult.success).catch(() => false);

    if (!claimSuccess) {
      const fee = await this.oracleContract.methods.estimate_query_fee();
      await this.contract.methods.pre_claim(url, address, {amount: fee.decodedResult});
    }

    return new Promise((resolve, reject) => {
      // check claim every second, 20 times
      let intervalCounter = 0;
      const interval = setInterval(async () => {
        if (((await this.contract.methods.check_claim(url, address)).decodedResult.success)) {
          clearInterval(interval);
          return resolve();
        }
        if (intervalCounter++ > 20) {
          clearInterval(interval);
          return reject({message: "check_claim interval timeout"});
        }
      }, 5000);
    });
  }

  async claimTips(address, url) {
    try {
      await this.preClaim(address, url);
      const result = await this.contract.methods.claim(url, address, false);
      return result.decodedResult;
    } catch (e) {
      console.log(e);
      if (e.message.includes('URL_NOT_EXISTING')) throw new Error(`Could not find any tips for url ${url}`);
      else throw new Error(e)
    }
  };

  getTipsRetips = (state) => {
    const findUrl = (urlId) => state.urls.find(([, id]) => urlId === id)[0];

    const findClaimGen = (tipClaimGen, urlId) => {
      const [, data] = state.claims.find(([id]) => id === urlId);

      return {
        unclaimed: tipClaimGen > data[0],
        claim_gen: data[0],
        unclaimed_amount: data[1],
      };
    };

    const findRetips = (tipId, urlId) => state.retips
      .filter(([, data]) => data.tip_id === tipId).map(([id, data]) => ({
        ...data,
        id,
        claim: findClaimGen(data.claim_gen, urlId),
        amount_ae: Util.atomsToAe(data.amount).toFixed(),
      }));

    const topicsRegex = /(#[a-zA-Z]+\b)(?!;)/g;

    const tips = state.tips.map(([id, data]) => {
      const tipsData = data;
      tipsData.id = id;
      tipsData.url = findUrl(tipsData.url_id);
      tipsData.topics = [...new Set(tipsData.title.match(topicsRegex))].map((x) => x.toLowerCase());
      tipsData.retips = findRetips(id, tipsData.url_id);
      tipsData.claim = findClaimGen(tipsData.claim_gen, tipsData.url_id);

      tipsData.amount_ae = Util.atomsToAe(tipsData.amount).toFixed();

      const retipAmount = tipsData.retips.reduce((acc, retip) => acc.plus(retip.amount), new BigNumber('0')).toFixed();

      tipsData.retip_amount_ae = Util.atomsToAe(retipAmount).toFixed();

      tipsData.total_amount = Util
        .atomsToAe(new BigNumber(tipsData.amount).plus(retipAmount)).toFixed();

      tipsData.total_unclaimed_amount = Util.atomsToAe(new BigNumber(tipsData.claim.unclaimed ? tipsData.amount : 0).plus(tipsData.retips.reduce((acc, retip) => acc.plus(retip.claim.unclaimed ? retip.amount : 0), new BigNumber('0'))).toFixed()).toFixed();

      return tipsData;
    });


    const urls = state.urls.map(([url, id]) => {
      const urlTips = tips.filter((tip) => tip.url_id === id);
      const claim = state.claims.find(([urlId]) => urlId === id)[1];

      return {
        url,
        tip_ids: urlTips.map((tip) => tip.id),
        retip_ids: urlTips.flatMap((tip) => tip.retips.map((retip) => retip.id)),
        unclaimed_amount: claim[1],
      };
    });

    const senders = [...new Set(tips
      .reduce((acc, tip) => acc
        .concat([tip.sender, ...tip.retips.map((retip) => retip.sender)]), []))];

    const stats = {
      tips_length: state.tips.length,
      retips_length: state.retips.length,
      total_tips_length: state.tips.length + state.retips.length,
      total_amount: tips.reduce((acc, tip) => acc.plus(tip.total_amount), new BigNumber('0')).toFixed(),
      total_unclaimed_amount: tips.reduce((acc, tip) => acc.plus(tip.total_unclaimed_amount), new BigNumber('0')).toFixed(),
      senders_length: senders.length,
    };

    return {
      stats,
      urls,
      tips,
    };
  };

}

const ae = new Aeternity();
module.exports = ae;
