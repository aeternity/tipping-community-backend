const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk');
const requireESM = require('esm')(module); // use to handle es6 import/export
const axios = require('axios');
const BigNumber = require('bignumber.js');
const TIPPING_V1_INTERFACE = require('tipping-contract/Tipping_v1_Interface.aes');
const TIPPING_V2_INTERFACE = require('tipping-contract/Tipping_v2_Interface.aes');
const ORACLE_SERVICE_INTERFACE = require('tipping-oracle-service/OracleServiceInterface.aes');
const TOKEN_CONTRACT_INTERFACE = require('aeternity-fungible-token/FungibleTokenFullInterface.aes');
const TOKEN_REGISTRY = require('token-registry/TokenRegistry.aes');
const tippingContractUtil = require('tipping-contract/util/tippingContractUtil');
const Util = require('./util');
const { TRACE_STATES } = require('../models/enums/trace');
const { topicsRegex } = require('./tipTopicUtil');
const Logger = require('./logger');

const { decodeEvents, SOPHIA_TYPES } = requireESM('@aeternity/aepp-sdk/es/contract/aci/transformation');

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'https://mainnet.aeternity.io';

class Aeternity {
  constructor() {
    this.init();
    this.logger = new Logger('Aeternity');
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

      this.contractV1 = await this.client.getContractInstance(TIPPING_V1_INTERFACE, { contractAddress: process.env.CONTRACT_V1_ADDRESS });
      this.contractV2 = await this.client.getContractInstance(TIPPING_V2_INTERFACE, { contractAddress: process.env.CONTRACT_V2_ADDRESS });
      this.oracleContract = await this.client.getContractInstance(
        ORACLE_SERVICE_INTERFACE,
        { contractAddress: process.env.ORACLE_CONTRACT_ADDRESS },
      );
      this.tokenRegistry = await this.client.getContractInstance(TOKEN_REGISTRY, { contractAddress: process.env.TOKEN_REGISTRY_ADDRESS });
      this.tokenContracts = {};
    }
  }

  setCache(cache) {
    this.cache = cache;
  }

  async networkId() {
    return (await this.client.getNodeInfo()).nodeNetworkId;
  }

  async middlewareContractTransactions() {
    const fetchOldContractTransactions = axios.get(`${MIDDLEWARE_URL}/middleware/contracts/transactions/address/${process.env.CONTRACT_V1_ADDRESS}`)
      .then(res => res.data.transactions
        .filter(tx => tx.tx.type === 'ContractCallTx'));

    const fetchContractTransactions = axios.get(`${MIDDLEWARE_URL}/middleware/contracts/transactions/address/${process.env.CONTRACT_V2_ADDRESS}`)
      .then(res => res.data.transactions
        .filter(tx => tx.tx.type === 'ContractCallTx'));

    return Promise.all([fetchOldContractTransactions, fetchContractTransactions])
      .then(([oldContractTransactions, contractTransactions]) => oldContractTransactions.concat(contractTransactions));
  }

  async transactionEvents(hash) {
    const fetchTransactionEvents = async () => {
      const tx = await this.client.tx(hash);
      const microBlock = await this.client.getMicroBlockHeader(tx.blockHash);

      const eventsSchema = [
        { name: 'TipReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
        { name: 'TipTokenReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string, SOPHIA_TYPES.address] },
        { name: 'ReTipReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
        { name: 'ReTipTokenReceived', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string, SOPHIA_TYPES.address] },
        { name: 'TipWithdrawn', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
        { name: 'QueryOracle', types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address] },
        { name: 'CheckPersistClaim', types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address, SOPHIA_TYPES.int] },
        { name: 'Transfer', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.address, SOPHIA_TYPES.int] },
        { name: 'Allowance', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.address, SOPHIA_TYPES.int] },
      ];

      const decodedEvents = decodeEvents(tx.log, { schema: eventsSchema });

      return decodedEvents.map(decodedEvent => {
        const event = {
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

    return this.cache.getOrSet(['transactionEvents', hash], () => fetchTransactionEvents());
  }

  async getOracleState() {
    const fetchOracleState = () => this.oracleContract.methods.get_state().then(res => res.decodedResult);

    return this.cache.getOrSet(['oracleState'], () => fetchOracleState(), this.cache.shortCacheTime);
  }

  addAdditionalTipsData(tips) {
    return tips.map(data => {
      const tip = data;
      tip.topics = [...new Set(tip.title.match(topicsRegex))].map(x => x.toLowerCase());

      tip.amount_ae = Util.atomsToAe(tip.amount).toFixed();
      tip.total_amount_ae = Util.atomsToAe(tip.total_amount).toFixed();
      tip.total_unclaimed_amount_ae = Util.atomsToAe(tip.total_unclaimed_amount).toFixed();
      tip.total_claimed_amount_ae = Util.atomsToAe(tip.total_claimed_amount).toFixed();

      tip.retips = tip.retips.map(retipData => {
        const retip = retipData;
        retip.amount_ae = Util.atomsToAe(retip.amount).toFixed();
        return retip;
      });

      return tip;
    });
  }

  async getTips() {
    const fetchTips = async () => {
      const fetchV1State = this.contractV1.methods.get_state();
      const fetchV2State = this.contractV2.methods.get_state();
      const { tips } = tippingContractUtil.getTipsRetips(await fetchV1State, await fetchV2State);
      return this.addAdditionalTipsData(tips);
    };

    return this.cache.getOrSet(['getTips'], () => fetchTips(), this.cache.shortCacheTime);
  }

  async getTokenRegistryState() {
    const fetchData = async () => this.tokenRegistry.methods.get_state().then(r => r.decodedResult);

    return this.cache.getOrSet(['getTokenRegistryState'], () => fetchData(), this.cache.shortCacheTime);
  }

  async getTokenMetaInfoCacheAccounts(address) {
    const fetchData = async () => {
      if (!this.tokenContracts[address]) {
        this.tokenContracts[address] = await this.client.getContractInstance(TOKEN_CONTRACT_INTERFACE, { contractAddress: address });
      }

      const metaInfo = await this.tokenContracts[address].methods.meta_info().then(r => r.decodedResult).catch(e => {
        this.logger.warn(e.message);
        return null;
      });

      // add token to registry if not added yet
      const tokenInRegistry = await this.getTokenRegistryState().then(state => state.find(([token]) => token === address));
      if (metaInfo && !tokenInRegistry) await this.tokenRegistry.methods.add_token(address);

      return metaInfo;
    };

    // just trigger cache buildup, no need to await for result
    this.getCacheTokenAccounts(address);

    return this.cache.getOrSet(['getTokenMetaInfo', address], () => fetchData());
  }

  async getCacheTokenBalances(account) {
    const cacheKeys = ['getCacheTokenAccounts.fetchBalances', account];
    const hasBalanceTokens = await this.cache.get(cacheKeys);
    return hasBalanceTokens || [];
  }

  async getCacheTokenAccounts(token) {
    const fetchBalances = async () => {
      if (!this.tokenContracts[token]) {
        this.tokenContracts[token] = await this.client.getContractInstance(TOKEN_CONTRACT_INTERFACE, { contractAddress: token });
      }

      const balances = await this.tokenContracts[token].methods.balances().then(r => r.decodedResult);
      balances.asyncMap(async ([account]) => {
        const cacheKeys = ['getCacheTokenAccounts.fetchBalances', account];
        const hasBalanceTokens = await this.cache.get(cacheKeys);
        const updatedBalanceTokens = hasBalanceTokens ? hasBalanceTokens.concat([token]) : [token];
        return this.cache.set(cacheKeys, [...new Set(updatedBalanceTokens)], this.cache.longCacheTime);
      });

      return true;
    };

    return this.cache.getOrSet(['getCacheTokenAccounts', token], () => fetchBalances(), this.cache.longCacheTime);
  }

  async checkPreClaimProperties(address, url, trace) {
    const amountV1 = await this.checkPreClaim(address, url, trace, this.contractV1).catch(console.error)
    const amountV2 = await this.checkPreClaim(address, url, trace, this.contractV2).catch(console.error)

    const claimAmount = new BigNumber(amountV1).plus(amountV2);

    if (claimAmount.isZero()) throw new Error('No zero amount claims');
    return claimAmount;
  }

  async checkPreClaim(address, url, trace, contract) {
    trace.update({
      state: TRACE_STATES.STARTED_PRE_CLAIM,
    });

    const claimAmount = await contract.methods.unclaimed_for_url(url).then(r => {
      return Array.isArray(r.decodedResult)
        ? r.decodedResult[1].reduce((acc, cur) => acc.plus(cur[1]), new BigNumber(r.decodedResult[0])).toFixed() //sum token amounts
        : String(r.decodedResult)
    }).catch(trace.catchError("0"));

    trace.update({
      state: TRACE_STATES.CLAIM_AMOUNT,
      claimAmount,
    });

    return claimAmount;
  }

  async preClaim(address, url, trace, contract) {
    await this.checkPreClaim(address, url, trace, contract);

    // pre-claim if necessary (if not already claimed successfully)
    const claimSuccess = await contract.methods.check_claim(url, address).then(r => r.decodedResult.success).catch(trace.catchError(false));

    trace.update({ state: TRACE_STATES.INITIAL_PRECLAIM_RESULT, claimSuccess });

    if (!claimSuccess) {
      const fee = await this.oracleContract.methods.estimate_query_fee();
      trace.update({ state: TRACE_STATES.ESTIMATED_FEE, fee: fee.decodedResult });

      await contract.methods.pre_claim(url, address, { amount: fee.decodedResult });
      trace.update({ state: TRACE_STATES.PRECLAIM_STARTED });

      return new Promise((resolve, reject) => {
        // check claim every second, 20 times
        let intervalCounter = 0;
        let interval = null;

        const checkPreClaimFinished = async () => {
          if ((await contract.methods.check_claim(url, address)).decodedResult.success) {
            clearInterval(interval);
            return resolve();
          }

          if (intervalCounter++ > 20) {
            clearInterval(interval);
            return reject(Error('check_claim interval timeout'));
          } return null;
        };

        // Run checks
        checkPreClaimFinished();
        interval = setInterval(checkPreClaimFinished, 5000);
      });
    }
    return claimSuccess;
  }

  async claimTips(address, url, trace) {
    await this.claimTipsOnContract(address, url, trace, this.contractV1).catch(console.error)
    await this.claimTipsOnContract(address, url, trace, this.contractV2).catch(console.error)
  }

  async claimTipsOnContract(address, url, trace, contract) {
    try {
      const claimSuccess = await this.preClaim(address, url, trace, contract);
      trace.update({ state: TRACE_STATES.FINAL_PRECLAIM_RESULT, claimSuccess });
      const result = await contract.methods.claim(url, address, false);
      trace.update({ state: TRACE_STATES.CLAIM_RESULT, tx: result, result: result.decodedResult });
      return result.decodedResult;
    } catch (e) {
      if (e.message && e.message.includes('NO_ZERO_AMOUNT_PAYOUT')) return null; //ignoring this
      if (e.message && e.message.includes('URL_NOT_EXISTING')) throw new Error(`Could not find any tips for url ${url}`);
      else throw new Error(e);
    }
  }

  async getChainNames() {
    return axios.get(`${MIDDLEWARE_URL}/middleware/names/active`).then(res => res.data).catch(this.logger.error);
  }

  async getAddressForChainName(name) {
    return this.client.aensQuery(name).catch(() => null);
  }
}

const ae = new Aeternity();
module.exports = ae;
