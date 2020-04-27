const {BigNumber} = require('bignumber.js');
const {Universal, Node, MemoryAccount} = require('@aeternity/aepp-sdk');
const fs = require('fs');
const Util = require('../utils/util');
const axios = require('axios');
require = require('esm')(module) //use to handle es6 import/export
const {decodeEvents, SOPHIA_TYPES} = require('@aeternity/aepp-sdk/es/contract/aci/transformation')

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
      this.oracleContract = await this.client.getContractInstance(this.getOracleContractSource(), {contractAddress: process.env.ORACLE_CONTRACT_ADDRESS});
    }
  };

  setCache = (cache) => {
    this.cache = cache;
  };

  networkId = async () => {
    return (await this.client.getNodeInfo()).nodeNetworkId
  };

  middlewareContractTransactions = async () => {
    return axios.get(`${process.env.MIDDLEWARE_URL}/middleware/contracts/transactions/address/${process.env.CONTRACT_ADDRESS}`)
      .then(res => res.data.transactions
        .filter(tx => tx.tx.type === "ContractCallTx")
        .map(tx => tx.hash));
  };

  transactionEvent = async (hash) => {
    const fetchTransactionEvent = async () => {
      const tx = await this.client.tx(hash)
      const microBlock = await this.client.getMicroBlockHeader(tx.blockHash)

      const eventsSchema = [
        {name: 'TipReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string]},
        {name: 'ReTipReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string]},
        {name: 'TipWithdrawn', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string]}
      ]

      const decodedEvent = decodeEvents(tx.log, {schema: eventsSchema});
      process.stdout.write(".");

      return decodedEvent.length ? {
        event: decodedEvent[0].name,
        address: `ak_${decodedEvent[0].decoded[1]}`,
        amount: decodedEvent[0].decoded[2],
        url: decodedEvent[0].decoded[0],
        caller: tx.tx.callerId,
        nonce: tx.tx.nonce,
        height: tx.height,
        hash: tx.hash,
        time: microBlock.time
      } : null;
    }

    return this.cache
      ? this.cache.getOrSet(["transactionEvent", hash], () => fetchTransactionEvent())
      : fetchTransactionEvent();
  }

  getOracleState = async () => {
    if (!this.client) throw new Error('Init sdk first');

    const fetchOracleState = () => this.oracleContract.methods.get_state().then(res => res.decodedResult);

    return this.cache
      ? this.cache.getOrSet(["oracleState"], () => fetchOracleState(), this.cache.shortCacheTime)
      : fetchOracleState();
  };

  getTips = async () => {
    if (!this.client) throw new Error('Init sdk first');
    const fetchTips = async () => {
      const state = await this.contract.methods.get_state();
      return this.getTipsRetips(state.decodedResult);
    };

    return this.cache
      ? this.cache.getOrSet(["getTips"], () => fetchTips(), this.cache.shortCacheTime)
      : fetchTips();
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
      await this.contract.methods.pre_claim(url, address, { amount: fee.decodedResult });

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
            return reject({ message: "check_claim interval timeout" });
          }
        }, 5000);
      });
    } else {
      return claimSuccess;
    }
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

    return state.tips.map(([id, data]) => {
      const tipsData = data;
      tipsData.id = id;
      tipsData.url = findUrl(tipsData.url_id);
      tipsData.topics = [...new Set(tipsData.title.match(topicsRegex))].map((x) => x.toLowerCase());
      tipsData.retips = findRetips(id, tipsData.url_id);
      tipsData.claim = findClaimGen(tipsData.claim_gen, tipsData.url_id);

      tipsData.amount_ae = Util.atomsToAe(tipsData.amount).toFixed();

      const retipAmount = tipsData.retips.reduce((acc, retip) => acc.plus(retip.amount), new BigNumber('0')).toFixed();

      tipsData.retip_amount_ae = Util.atomsToAe(retipAmount).toFixed();

      tipsData.total_amount = Util.atomsToAe(new BigNumber(tipsData.amount).plus(retipAmount)).toFixed();
      tipsData.total_unclaimed_amount = Util.atomsToAe(
        new BigNumber(tipsData.claim.unclaimed ? tipsData.amount : 0)
          .plus(tipsData.retips
            .reduce((acc, retip) =>
              acc.plus(retip.claim.unclaimed ? retip.amount : 0), new BigNumber('0'))).toFixed()).toFixed();

      tipsData.total_claimed_amount = Util.atomsToAe(
        new BigNumber(tipsData.claim.unclaimed ? 0 : tipsData.amount)
          .plus(tipsData.retips
            .reduce((acc, retip) =>
              acc.plus(retip.claim.unclaimed ? 0 : retip.amount), new BigNumber('0'))).toFixed()).toFixed();

      return tipsData;
    });
  };

}

const ae = new Aeternity();
module.exports = ae;
