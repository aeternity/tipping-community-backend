const {BigNumber} = require('bignumber.js');
const {Universal, Node, MemoryAccount} = require('@aeternity/aepp-sdk');
const fs = require('fs');

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

  getTips = async () => {
    if (!this.client) throw new Error('Init sdk first');
    const state = await this.contract.methods.get_state();
    return this.getTipsRetips(state.decodedResult).tips;
  };

  getContractSource = () => {
    if (!process.env.CONTRACT_FILE) throw new Error(`env.CONTRACT_FILE is ${process.env.CONTRACT_FILE}`);
    return fs.readFileSync(`${__dirname}/${process.env.CONTRACT_FILE}.aes`, 'utf-8');
  };

  getOracleContractSource = () => {
    return fs.readFileSync(`${__dirname}/OracleServiceInterface.aes`, 'utf-8');
  };

  async preClaim(address, url) {
    const claimAmount = await this.contract.methods.unclaimed_for_url(url).then(r => r.decodedResult).catch(() => 1);
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
      if (e.message.includes('URL_NOT_EXISTING')) throw new Error(`Could not find any tips for url ${url}`);
      else throw new Error(JSON.stringify(e))
    }
  };

  getTipsRetips = (state) => {
    const findUrl = (urlId) => state.urls.find(([_, id]) => urlId === id)[0];

    const findClaimGen = (tipClaimGen, urlId) => {
      const [_, data] = state.claims.find(([id, _]) => id === urlId);

      return {
        unclaimed: tipClaimGen > data[0],
        claim_gen: data[0],
        unclaimed_amount: data[1],
      };
    };

    const findRetips = (tipId, urlId) => state.retips.filter(([_, data]) => data.tip_id === tipId).map(([id, data]) => {
      data.id = id;
      data.claim = findClaimGen(data.claim_gen, urlId);
      return data;
    });

    const tips = state.tips.map(([id, data]) => {
      data.id = id;
      data.url = findUrl(data.url_id);
      data.retips = findRetips(id, data.url_id);
      data.claim = findClaimGen(data.claim_gen, data.url_id);

      data.total_amount = new BigNumber(data.amount).plus(data.retips.reduce((acc, retip) => {
        return acc.plus(retip.amount);
      }, new BigNumber('0'))).toFixed();

      data.total_unclaimed_amount = new BigNumber(data.claim.unclaimed ? data.amount : 0).plus(data.retips.reduce((acc, retip) => {
        return acc.plus(retip.claim.unclaimed ? retip.amount : 0);
      }, new BigNumber('0'))).toFixed();

      return data;
    });

    const urls = state.urls.map(([url, id]) => {
      const urlTips = tips.filter(tip => tip.url_id === id);
      const claim = state.claims.find(([urlId, _]) => urlId === id)[1];

      return {
        id: id,
        url: url,
        tip_ids: urlTips.map(tip => tip.id),
        retip_ids: urlTips.flatMap(tip => tip.retips.map(retip => retip.id)),
        unclaimed_amount: claim[1],
      };
    });

    return {
      urls: urls,
      tips: tips,
    };
  };

}

const ae = new Aeternity();
module.exports = ae;
