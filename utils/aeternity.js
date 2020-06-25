const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk');
const fs = require('fs');
const requireESM = require('esm')(module); // use to handle es6 import/export
const axios = require('axios');
const Util = require('./util');
const { TRACE_STATES } = require('../models/enums/trace');
const tippingContractUtil = require('tipping-contract/util/tippingContractUtil');
const { topicsRegex } = require('./tipTopicUtil');
const logger = require('./logger')(module);

const { decodeEvents, SOPHIA_TYPES } = requireESM('@aeternity/aepp-sdk/es/contract/aci/transformation');

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'https://mainnet.aeternity.io';

const TIPPING_INTERFACE = fs.readFileSync(`${__dirname}/contracts/TippingInterface.aes`, 'utf-8');
const ORACLE_SERVICE_INTERFACE = fs.readFileSync(`${__dirname}/contracts/OracleServiceInterface.aes`, 'utf-8');
const TOKEN_CONTRACT_INTERFACE = fs.readFileSync(`${__dirname}/contracts/FungibleTokenInterface.aes`, 'utf-8');

class Aeternity {
  constructor() {
    this.init();
  }

  async init() {
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
      this.contract = await this.client.getContractInstance(TIPPING_INTERFACE, { contractAddress: process.env.CONTRACT_ADDRESS });
      this.oracleContract = await this.client.getContractInstance(
        ORACLE_SERVICE_INTERFACE,
        { contractAddress: process.env.ORACLE_CONTRACT_ADDRESS },
      );
    }
  }

  async networkId() {
    return (await this.client.getNodeInfo()).nodeNetworkId;
  }

  async middlewareContractTransactions() {
    const oldContractTransactions = axios.get(`${MIDDLEWARE_URL}/middleware/contracts/transactions/address/${process.env.OLD_CONTRACT_ADDRESS}`)
      .then(res => res.data.transactions
        .filter(tx => tx.tx.type === 'ContractCallTx'));

    const contractTransactions = axios.get(`${MIDDLEWARE_URL}/middleware/contracts/transactions/address/${process.env.CONTRACT_ADDRESS}`)
      .then(res => res.data.transactions
        .filter(tx => tx.tx.type === 'ContractCallTx'));

    return Promise.all([oldContractTransactions, contractTransactions])
      .then(([oldContractTransactions, contractTransactions]) =>
        oldContractTransactions.concat(contractTransactions));
  }

  async fetchTransactionEvents(hash) {
    const tx = await this.client.tx(hash);
    const microBlock = await this.client.getMicroBlockHeader(tx.blockHash);

    const eventsSchema = [
      { name: 'TipReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
      {
        name: 'TipTokenReceived',
        types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string, SOPHIA_TYPES.address],
      },
      { name: 'ReTipReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
      {
        name: 'ReTipTokenReceived',
        types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string, SOPHIA_TYPES.address],
      },
      { name: 'TipWithdrawn', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
      { name: 'QueryOracle', types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address] },
      { name: 'CheckPersistClaim', types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address, SOPHIA_TYPES.int] },
      { name: 'Transfer', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.address, SOPHIA_TYPES.int] },
      { name: 'Allowance', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.address, SOPHIA_TYPES.int] },
    ];

    const decodedEvents = decodeEvents(tx.log, { schema: eventsSchema });

    return decodedEvents.map(decodedEvent => {
      let event = {
        event: decodedEvent.name,
        caller: tx.tx.callerId,
        nonce: tx.tx.nonce,
        height: tx.height,
        hash: tx.hash,
        time: microBlock.time,
        contract: tx.contractId,
      };
      switch (decodedEvent.name) {
        case 'Transfer':
          event.from = `ak_${decodedEvent.decoded[0]}`;
          event.to = `ak_${decodedEvent.decoded[1]}`;
          event.amount = decodedEvent.decoded[2] ? decodedEvent.decoded[2] : null;
          break;
        case 'Allowance':
          event.from = `ak_${decodedEvent.decoded[0]}`;
          event.for = `ak_${decodedEvent.decoded[1]}`;
          event.amount = decodedEvent.decoded[2] ? decodedEvent.decoded[2] : null;
          break;
        case 'CheckPersistClaim':
          event.address = `ak_${decodedEvent.decoded[1]}`;
          event.amount = decodedEvent.decoded[2] ? decodedEvent.decoded[2] : null;
          event.url = decodedEvent.decoded[0]; // eslint-disable-line prefer-destructuring
          break;
        case 'QueryOracle':
          event.address = `ak_${decodedEvent.decoded[1]}`;
          event.url = decodedEvent.decoded[0]; // eslint-disable-line prefer-destructuring
          break;
        default:
          event.address = `ak_${decodedEvent.decoded[0]}`;
          event.amount = decodedEvent.decoded[1] ? decodedEvent.decoded[1] : null;
          event.url = decodedEvent.decoded[2]; // eslint-disable-line prefer-destructuring
      }
      return event;
    });
  };

  async fetchOracleState() {
    if (!this.client) throw new Error('Init sdk first');
    return this.oracleContract.methods.get_state().then(res => res.decodedResult);
  }

  static addAdditionalTipsData = (tips) => {
    return tips.map(tip => {
      tip.topics = [...new Set(tip.title.match(topicsRegex))].map((x) => x.toLowerCase());

      tip.amount_ae = Util.atomsToAe(tip.amount).toFixed();
      tip.total_amount_ae = Util.atomsToAe(tip.total_amount).toFixed();
      tip.total_unclaimed_amount_ae = Util.atomsToAe(tip.total_unclaimed_amount).toFixed();
      tip.total_claimed_amount_ae = Util.atomsToAe(tip.total_claimed_amount).toFixed();

      tip.retips = tip.retips.map(retip => {
        retip.amount_ae = Util.atomsToAe(retip.amount).toFixed();
        return retip;
      });

      return tip;
    });
  };

  async fetchTips() {
    if (!this.client) throw new Error('Init sdk first');
    const state = await this.contract.methods.get_state();
    const tips = tippingContractUtil.getTipsRetips(state.decodedResult).tips;
    return Aeternity.addAdditionalTipsData(tips);
  }
  getContractSource() {
    if (!process.env.CONTRACT_FILE) throw new Error(`env.CONTRACT_FILE is ${process.env.CONTRACT_FILE}`);
    return fs.readFileSync(`${__dirname}/${process.env.CONTRACT_FILE}.aes`, 'utf-8');
  }

  getOracleContractSource() {
    return fs.readFileSync(`${__dirname}/OracleServiceInterface.aes`, 'utf-8');
  }

  getTokenMetaInfo = async (address) => {
    const fetchData = async () => {
      const contract = await this.client.getContractInstance(TOKEN_CONTRACT_INTERFACE, { contractAddress: address });
      return contract.methods.meta_info().then(r => r.decodedResult);
    };

    return this.cache
      ? this.cache.getOrSet(['getTokenMetaInfo', address], () => fetchData())
      : fetchData();
  };

  async getClaimableAmount(address, url, trace) {
    trace.update({
      state: TRACE_STATES.STARTED_PRE_CLAIM,
    });
    const claimAmount = await this.contract.methods.unclaimed_for_url(url).then(r => r.decodedResult).catch(trace.catchError(0));

    trace.update({
      state: TRACE_STATES.CLAIM_AMOUNT,
      claimAmount,
    });

    return claimAmount;
  }

  async preClaim(address, url, trace) {
    const amount = await this.getClaimableAmount(address, url, trace);

    if (amount === 0) return false;

    // pre-claim if necessary (if not already claimed successfully)
    const claimSuccess = await this.contract.methods.check_claim(url, address).then(r => r.decodedResult.success).catch(trace.catchError(false));

    trace.update({ state: TRACE_STATES.INITIAL_PRECLAIM_RESULT, claimSuccess });

    if (!claimSuccess) {
      const fee = await this.oracleContract.methods.estimate_query_fee();
      trace.update({ state: TRACE_STATES.ESTIMATED_FEE, fee: fee.decodedResult });
      await this.contract.methods.pre_claim(url, address, { amount: fee.decodedResult });
      trace.update({ state: TRACE_STATES.PRECLAIM_STARTED });

      return new Promise((resolve, reject) => {
        // check claim every second, 20 times
        let intervalCounter = 0;
        let interval = null;

        const checkPreClaimFinished = async () => {
          if (((await this.contract.methods.check_claim(url, address)).decodedResult.success)) {
            clearInterval(interval);
            return resolve();
          }
          if (intervalCounter++ > 20) {
            clearInterval(interval);
            return reject(Error('check_claim interval timeout'));
          }
          return null;
        };

        // Run checks
        checkPreClaimFinished();
        interval = setInterval(checkPreClaimFinished, 5000);
      });
    }
    return claimSuccess;
  }

  async claimTips(address, url, trace) {
    try {
      const claimSuccess = await this.preClaim(address, url, trace);
      trace.update({ state: TRACE_STATES.FINAL_PRECLAIM_RESULT, claimSuccess });
      const result = await this.contract.methods.claim(url, address, false);
      trace.update({ state: TRACE_STATES.CLAIM_RESULT, tx: result, result: result.decodedResult });
      return result.decodedResult;
    } catch (e) {
      if (e.message && e.message.includes('URL_NOT_EXISTING')) throw new Error(`Could not find any tips for url ${url}`);
      else throw new Error(e);
    }
  }

  getTipsRetips(state) {
    const findUrl = urlId => state.urls.find(([, id]) => urlId === id)[0];

    const findClaimGen = (tipClaimGen, urlId) => {
      const [, data] = state.claims.find(([id]) => id === urlId);

      return {
        unclaimed: tipClaimGen > data[0],
        claim_gen: data[0],
        unclaimed_amount: data[1],
      };
    };

    const findRetips = (tipId, urlId) => state.retips
      .filter(([, data]) => String(data.tip_id) === String(tipId)).map(([id, data]) => ({
        ...data,
        id: String(id),
        claim: findClaimGen(data.claim_gen, urlId),
        amount_ae: Util.atomsToAe(data.amount).toFixed(),
      }));

    return state.tips.map(([id, data]) => {
      const tipsData = data;
      tipsData.id = String(id);
      tipsData.url = findUrl(tipsData.url_id);
      tipsData.topics = [...new Set(tipsData.title.match(topicsRegex))].map(x => x.toLowerCase());
      tipsData.retips = findRetips(id, tipsData.url_id);
      tipsData.claim = findClaimGen(tipsData.claim_gen, tipsData.url_id);

      tipsData.amount_ae = Util.atomsToAe(tipsData.amount).toFixed();

      const retipAmount = tipsData.retips.reduce((acc, retip) => acc.plus(retip.amount), new BigNumber('0')).toFixed();

      tipsData.retip_amount_ae = Util.atomsToAe(retipAmount).toFixed();

      tipsData.total_amount = Util.atomsToAe(new BigNumber(tipsData.amount).plus(retipAmount)).toFixed();
      tipsData.total_unclaimed_amount = Util.atomsToAe(
        new BigNumber(tipsData.claim.unclaimed ? tipsData.amount : 0)
          .plus(tipsData.retips
            .reduce((acc, retip) => acc.plus(retip.claim.unclaimed ? retip.amount : 0), new BigNumber('0'))).toFixed(),
      ).toFixed();

      tipsData.total_claimed_amount = Util.atomsToAe(
        new BigNumber(tipsData.claim.unclaimed ? 0 : tipsData.amount)
          .plus(tipsData.retips
            .reduce((acc, retip) => acc.plus(retip.claim.unclaimed ? 0 : retip.amount), new BigNumber('0'))).toFixed(),
      ).toFixed();

      return tipsData;
    });
  }

  async getChainNames() {
    return axios.get(`${MIDDLEWARE_URL}/middleware/names/active`).then(res => res.data).catch(logger.error);
  }

  async getAddressForChainName(name) {
    return this.client.aensQuery(name).catch(() => null);
  }
}

const ae = new Aeternity();
module.exports = ae;
