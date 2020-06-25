const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk');
const fs = require('fs');
const Util = require('../utils/util');
const axios = require('axios');
const Trace = require('../utils/trace');
require = require('esm')(module); //use to handle es6 import/export
const { decodeEvents, SOPHIA_TYPES } = require('@aeternity/aepp-sdk/es/contract/aci/transformation');
const { topicsRegex } = require('./tipTopicUtil')
const tippingContractUtil = require('tipping-contract/util/tippingContractUtil');

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'https://mainnet.aeternity.io';

const TIPPING_INTERFACE = fs.readFileSync(`${__dirname}/contracts/TippingInterface.aes`, 'utf-8');
const ORACLE_SERVICE_INTERFACE = fs.readFileSync(`${__dirname}/contracts/OracleServiceInterface.aes`, 'utf-8');
const TOKEN_CONTRACT_INTERFACE = fs.readFileSync(`${__dirname}/contracts/FungibleTokenInterface.aes`, 'utf-8');
const TOKEN_REGISTRY = fs.readFileSync(`${__dirname}/contracts/TokenRegistry.aes`, 'utf-8');

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
      this.contract = await this.client.getContractInstance(TIPPING_INTERFACE, { contractAddress: process.env.CONTRACT_ADDRESS });
      this.oracleContract = await this.client.getContractInstance(ORACLE_SERVICE_INTERFACE, { contractAddress: process.env.ORACLE_CONTRACT_ADDRESS });
    }
  };

  setCache = (cache) => {
    this.cache = cache;
  };

  networkId = async () => {
    return (await this.client.getNodeInfo()).nodeNetworkId;
  };

  middlewareContractTransactions = async () => {
    const oldContractTransactions = axios.get(`${MIDDLEWARE_URL}/middleware/contracts/transactions/address/${process.env.OLD_CONTRACT_ADDRESS}`)
      .then(res => res.data.transactions
        .filter(tx => tx.tx.type === 'ContractCallTx'));

    const contractTransactions = axios.get(`${MIDDLEWARE_URL}/middleware/contracts/transactions/address/${process.env.CONTRACT_ADDRESS}`)
      .then(res => res.data.transactions
        .filter(tx => tx.tx.type === 'ContractCallTx'));

    return Promise.all([oldContractTransactions, contractTransactions])
      .then(([oldContractTransactions, contractTransactions]) =>
        oldContractTransactions.concat(contractTransactions));
  };

  transactionEvents = async (hash) => {
    const fetchTransactionEvents = async () => {
      const tx = await this.client.tx(hash);
      const microBlock = await this.client.getMicroBlockHeader(tx.blockHash);

      const eventsSchema = [
        {name: 'TipReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string]},
        {name: 'TipTokenReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string, SOPHIA_TYPES.address]},
        {name: 'ReTipReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string]},
        {name: 'ReTipTokenReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string, SOPHIA_TYPES.address]},
        {name: 'TipWithdrawn', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string]},
        {name: 'QueryOracle', types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address]},
        {name: 'CheckPersistClaim', types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address, SOPHIA_TYPES.int]},
        {name: 'Transfer', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.address, SOPHIA_TYPES.int]},
        {name: 'Allowance', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.address, SOPHIA_TYPES.int]}
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
        }
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
            event.url = decodedEvent.decoded[0];
            break;
          case 'QueryOracle':
            event.address = `ak_${decodedEvent.decoded[1]}`;
            event.url = decodedEvent.decoded[0];
            break;
          default:
            event.address = `ak_${decodedEvent.decoded[0]}`;
            event.amount = decodedEvent.decoded[1] ? decodedEvent.decoded[1] : null;
            event.url = decodedEvent.decoded[2];
        }
        return event;
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
    })
  }

  getTips = async () => {
    if (!this.client) throw new Error('Init sdk first');
    const fetchTips = async () => {
      const state = await this.contract.methods.get_state();
      const tips = tippingContractUtil.getTipsRetips(state.decodedResult).tips;
      return Aeternity.addAdditionalTipsData(tips)
    };

    return this.cache
      ? this.cache.getOrSet(['getTips'], () => fetchTips(), this.cache.shortCacheTime)
      : fetchTips();
  };

  getTokenRegistryState = async () => {
    const fetchData = async () => {
      const contract = await this.client.getContractInstance(TOKEN_REGISTRY, {contractAddress: process.env.TOKEN_REGISTRY_ADDRESS});
      return contract.methods.get_state().then(r => r.decodedResult);
    }

    return this.cache
      ? this.cache.getOrSet(["getTokenRegistryState"], () => fetchData(), this.cache.shortCacheTime)
      : fetchData();
  }

  getTokenMetaInfo = async (address) => {
    const fetchData = async () => {
      const contract = await this.client.getContractInstance(TOKEN_CONTRACT_INTERFACE, {contractAddress: address});

      // add token to registry if not added yet
      const tokenInRegistry = await this.getTokenRegistryState().then(state => state.find(([token, _]) => token === address));
      if (!tokenInRegistry) {
        const contract = await this.client.getContractInstance(TOKEN_REGISTRY, {contractAddress: process.env.TOKEN_REGISTRY_ADDRESS});
        await contract.methods.add_token(address);
      }

      return contract.methods.meta_info().then(r => r.decodedResult);
    }

    return this.cache
      ? this.cache.getOrSet(["getTokenMetaInfo", address], () => fetchData())
      : fetchData();
  }

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
          if ((await this.contract.methods.check_claim(url, address)).decodedResult.success) {
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

  async getChainNames () {
    return axios.get(`${MIDDLEWARE_URL}/middleware/names/active`).then(res => res.data).catch(console.error);
  }

  async getChainNamesByAddress (address) {
    return axios.get(`${MIDDLEWARE_URL}/middleware/names/reverse/${address}`).then(res => res.data).catch(console.error);
  }
}

const ae = new Aeternity();
module.exports = ae;
