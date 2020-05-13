const { BigNumber } = require('bignumber.js');
const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk');
const fs = require('fs');
const Util = require('../utils/util');
const axios = require('axios');
const { Trace } = require('../logic/tracingLogic');
require = require('esm')(module); //use to handle es6 import/export
const { decodeEvents, SOPHIA_TYPES } = require('@aeternity/aepp-sdk/es/contract/aci/transformation');
const { topicsRegex } = require('./tipTopicUtil')

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'https://mainnet.aeternity.io';

class Aeternity {
  constructor () {
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
          MemoryAccount({ keypair: { secretKey: process.env.PRIVATE_KEY, publicKey: process.env.PUBLIC_KEY } }),
        ],
        address: process.env.PUBLIC_KEY,
        compilerUrl: process.env.COMPILER_URL,
      });
      this.contract = await this.client.getContractInstance(this.getContractSource(), { contractAddress: process.env.CONTRACT_ADDRESS });
      this.oracleContract = await this.client.getContractInstance(this.getOracleContractSource(), { contractAddress: process.env.ORACLE_CONTRACT_ADDRESS });
    }
  };

  setCache = (cache) => {
    this.cache = cache;
  };

  networkId = async () => {
    return (await this.client.getNodeInfo()).nodeNetworkId;
  };

  middlewareContractTransactions = async () => {
    return axios.get(`${MIDDLEWARE_URL}/middleware/contracts/transactions/address/${process.env.CONTRACT_ADDRESS}`)
      .then(res => res.data.transactions
        .filter(tx => tx.tx.type === 'ContractCallTx'));
  };

  transactionEvents = async (hash) => {
    const fetchTransactionEvents = async () => {
      const tx = await this.client.tx(hash);
      const microBlock = await this.client.getMicroBlockHeader(tx.blockHash);

      const eventsSchema = [
        { name: 'TipReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
        { name: 'ReTipReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
        { name: 'TipWithdrawn', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
        {name: 'QueryOracle', types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address]},
        {name: 'CheckPersistClaim', types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address, SOPHIA_TYPES.int]}
      ];

      const decodedEvents = decodeEvents(tx.log, { schema: eventsSchema });

      return decodedEvents.map(decodedEvent => {
        return {
          event: decodedEvent.name,
          address: `ak_${decodedEvent.decoded[1]}`,
          amount: decodedEvent.decoded[2] ? decodedEvent.decoded[2] : null,
          url: decodedEvent.decoded[0],
          caller: tx.tx.callerId,
          nonce: tx.tx.nonce,
          height: tx.height,
          hash: tx.hash,
          time: microBlock.time,
        };
      });
    };

    return this.cache
      ? this.cache.getOrSet(["transactionEvents", hash], () => fetchTransactionEvents())
      : fetchTransactionEvents();
  }

  getOracleState = async () => {
    if (!this.client) throw new Error('Init sdk first');

    const fetchOracleState = () => this.oracleContract.methods.get_state().then(res => res.decodedResult);

    return this.cache
      ? this.cache.getOrSet(['oracleState'], () => fetchOracleState(), this.cache.shortCacheTime)
      : fetchOracleState();
  };

  getTips = async () => {
    if (!this.client) throw new Error('Init sdk first');
    const fetchTips = async () => {
      const state = await this.contract.methods.get_state();
      return this.getTipsRetips(state.decodedResult);
    };

    return this.cache
      ? this.cache.getOrSet(['getTips'], () => fetchTips(), this.cache.shortCacheTime)
      : fetchTips();
  };

  getContractSource = () => {
    if (!process.env.CONTRACT_FILE) throw new Error(`env.CONTRACT_FILE is ${process.env.CONTRACT_FILE}`);
    return fs.readFileSync(`${__dirname}/${process.env.CONTRACT_FILE}.aes`, 'utf-8');
  };

  getOracleContractSource = () => {
    return fs.readFileSync(`${__dirname}/OracleServiceInterface.aes`, 'utf-8');
  };

  async checkPreClaim (address, url, trace) {
    trace.update({
      state: Trace.state.STARTED_PRE_CLAIM,
    });
    const claimAmount = await this.contract.methods.unclaimed_for_url(url).then(r => r.decodedResult).catch(trace.catchError(0));

    trace.update({
      state: Trace.state.CLAIM_AMOUNT,
      claimAmount,
    });

    if (claimAmount === 0) throw new Error('No zero amount claims');

    return claimAmount;
  }

  async preClaim (address, url, trace) {
    await this.checkPreClaim(address, url, trace);

    // pre-claim if necessary (if not already claimed successfully)
    const claimSuccess = await this.contract.methods.check_claim(url, address).then(r => r.decodedResult.success).catch(trace.catchError(false));

    trace.update({ state: Trace.state.INITIAL_PRECLAIM_RESULT, claimSuccess });

    if (!claimSuccess) {
      const fee = await this.oracleContract.methods.estimate_query_fee();
      trace.update({ state: Trace.state.ESTIMATED_FEE, fee: fee.decodedResult });
      await this.contract.methods.pre_claim(url, address, { amount: fee.decodedResult });
      trace.update({ state: Trace.state.PRECLAIM_STARTED });

      return new Promise((resolve, reject) => {
        // check claim every second, 20 times
        let intervalCounter = 0;

        const checkPreClaimFinished = async () => {
          if (((await this.contract.methods.check_claim(url, address)).decodedResult.success)) {
            clearInterval(interval);
            return resolve();
          }
          if (intervalCounter++ > 20) {
            clearInterval(interval);
            return reject('check_claim interval timeout');
          }
        }

        // Run checks
        checkPreClaimFinished();
        const interval = setInterval(checkPreClaimFinished, 5000);


      });
    } else {
      return claimSuccess;
    }
  }

  async claimTips (address, url, trace) {
    try {
      const claimSuccess = await this.preClaim(address, url, trace);
      trace.update({ state: Trace.state.FINAL_PRECLAIM_RESULT, claimSuccess });
      const result = await this.contract.methods.claim(url, address, false);
      trace.update({ state: Trace.state.CLAIM_RESULT, tx: result, result: result.decodedResult });
      return result.decodedResult;
    } catch (e) {
      console.log(e);
      if (e.message && e.message.includes('URL_NOT_EXISTING')) throw new Error(`Could not find any tips for url ${url}`);
      else throw new Error(e);
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

  async getChainNames () {
    return axios.get(`${MIDDLEWARE_URL}/middleware/names/active`).then(res => res.data).catch(console.error);
  }

  async getChainNamesByAddress (address) {
    return axios.get(`${MIDDLEWARE_URL}/middleware/names/reverse/${address}`).then(res => res.data).catch(console.error);
  }
}

const ae = new Aeternity();
module.exports = ae;
