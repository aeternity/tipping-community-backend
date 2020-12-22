const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk');
const requireESM = require('esm')(module); // use to handle es6 import/export
const tippingContractUtil = require('tipping-contract/util/tippingContractUtil');
const BigNumber = require('bignumber.js');
const Sentry = require('@sentry/node');

const { decodeEvents, SOPHIA_TYPES } = requireESM('@aeternity/aepp-sdk/es/contract/aci/transformation');

const TIPPING_V1_INTERFACE = require('tipping-contract/Tipping_v1_Interface.aes');
const TIPPING_V2_INTERFACE = require('tipping-contract/Tipping_v2_Interface.aes');
const TIPPING_V3_INTERFACE = require('tipping-contract/Tipping_v3_Interface.aes');
const ORACLE_SERVICE_INTERFACE = require('tipping-oracle-service/OracleServiceInterface.aes');
const TOKEN_CONTRACT_INTERFACE = require('aeternity-fungible-token/FungibleTokenFullInterface.aes');
const TOKEN_REGISTRY = require('token-registry/TokenRegistry.aes');
const logger = require('../../../utils/logger')(module);
const { topicsRegex } = require('../utils/tipTopicUtil');
const { TRACE_STATES } = require('../../payfortx/constants/traceStates');
const Util = require('../utils/util');

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

      this.contractV1 = await this.client.getContractInstance(TIPPING_V1_INTERFACE, { contractAddress: process.env.CONTRACT_V1_ADDRESS });
      if (process.env.CONTRACT_V2_ADDRESS) {
        this.contractV2 = await this.client.getContractInstance(TIPPING_V2_INTERFACE, { contractAddress: process.env.CONTRACT_V2_ADDRESS });
        logger.info('Starting WITH V2 contract');
      } else {
        logger.info('Starting WITHOUT V2 contract');
      }

      if (process.env.CONTRACT_V3_ADDRESS) {
        this.contractV3 = await this.client.getContractInstance(TIPPING_V3_INTERFACE, { contractAddress: process.env.CONTRACT_V3_ADDRESS });
        logger.info('Starting WITH V3 contract');
      } else {
        logger.info('Starting WITHOUT V3 contract');
      }

      this.oracleContract = await this.client.getContractInstance(
        ORACLE_SERVICE_INTERFACE,
        { contractAddress: process.env.ORACLE_CONTRACT_ADDRESS },
      );
      this.tokenRegistry = await this.client.getContractInstance(TOKEN_REGISTRY, { contractAddress: process.env.TOKEN_REGISTRY_ADDRESS });
      this.tokenContracts = {};
    }
  }

  async networkId() {
    return (await this.client.getNodeInfo()).nodeNetworkId;
  }

  async decodeTransactionEvents(data) {
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

    const decodedEvents = decodeEvents(data.tx.log, { schema: eventsSchema });

    return decodedEvents.map(decodedEvent => {
      const event = {
        event: decodedEvent.name,
        caller: data.tx.caller_id,
        nonce: data.tx.nonce,
        height: data.block_height,
        hash: data.hash,
        time: data.micro_time,
        contract: data.tx.contract_id,
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
  }

  async fetchOracleState() {
    if (!this.client) throw new Error('Init sdk first');
    return this.oracleContract.methods.get_state().then(res => res.decodedResult).catch(e => {
      logger.error(e.message);
      Sentry.captureException(e);
      return [];
    });
  }

  static addAdditionalTipsData = tips => tips.map(tip => ({
    ...tip,
    topics: [...new Set(tip.title.match(topicsRegex))].map(x => x.toLowerCase()),
    amount_ae: Util.atomsToAe(tip.amount).toFixed(),
    total_amount_ae: Util.atomsToAe(tip.total_amount).toFixed(),
    total_unclaimed_amount_ae: Util.atomsToAe(tip.total_unclaimed_amount).toFixed(),
    total_claimed_amount_ae: Util.atomsToAe(tip.total_claimed_amount).toFixed(),
    retips: tip.retips.map(retip => ({
      ...retip,
      amount_ae: Util.atomsToAe(retip.amount).toFixed(),
    })),
  }));

  async fetchTips() {
    if (!this.client) throw new Error('Init sdk first');
    try {
      const fetchV1State = this.contractV1.methods.get_state();
      const fetchV2State = process.env.CONTRACT_V2_ADDRESS ? this.contractV2.methods.get_state() : Promise.resolve(null);
      const fetchV3State = process.env.CONTRACT_V3_ADDRESS ? this.contractV3.methods.get_state() : Promise.resolve(null);
      const { tips } = tippingContractUtil.getTipsRetips(...[await fetchV1State, await fetchV2State, await fetchV3State].filter(state => state));
      return Aeternity.addAdditionalTipsData(tips);
    } catch (e) {
      logger.error(e.message);
      Sentry.captureException(e);
      return [];
    }
  }

  async fetchTokenRegistryState() {
    return this.tokenRegistry.methods.get_state().then(r => r.decodedResult).catch(e => {
      logger.error(e.message);
      Sentry.captureException(e);
      return [];
    });
  }

  async fetchTokenMetaInfo(contractAddress) {
    if (!this.tokenContracts[contractAddress]) {
      this.tokenContracts[contractAddress] = await this.client.getContractInstance(
        TOKEN_CONTRACT_INTERFACE, { contractAddress },
      );
    }
    return this.tokenContracts[contractAddress].methods.meta_info().then(r => r.decodedResult).catch(e => {
      logger.error(e.message);
      Sentry.captureException(e);
      return null;
    });
  }

  async addTokenToRegistry(contractAddress) {
    return this.tokenRegistry.methods.add_token(contractAddress).catch(e => {
      logger.error(e.message);
      Sentry.captureException(e);
      return [];
    });
  }

  // TODO optimize cache generation for account balances
  async fetchTokenAccountBalances(contractAddress) {
    if (!this.tokenContracts[contractAddress]) {
      this.tokenContracts[contractAddress] = await this.client.getContractInstance(
        TOKEN_CONTRACT_INTERFACE, { contractAddress },
      );
    }
    return this.tokenContracts[contractAddress].methods.balances()
      .then(r => r.decodedResult)
      .catch(e => {
        logger.error(e.message);
        Sentry.captureException(e);
        return null;
      });
  }

  async checkPreClaimProperties(address, url, trace) {
    const amountV1 = await this.checkPreClaim(address, url, trace, this.contractV1).catch(logger.error);

    if (process.env.CONTRACT_V2_ADDRESS) {
      const amountV2 = await this.checkPreClaim(address, url, trace, this.contractV2).catch(logger.error);
      return new BigNumber(amountV1).plus(amountV2);
    }
    return new BigNumber(amountV1);
  }

  async checkPreClaim(address, url, trace, contract) {
    trace.update({
      state: TRACE_STATES.STARTED_PRE_CLAIM,
    });

    const claimAmount = await contract.methods.unclaimed_for_url(url).then(r => (Array.isArray(r.decodedResult)
      ? r.decodedResult[1].reduce((acc, cur) => acc.plus(cur[1]), new BigNumber(r.decodedResult[0])).toFixed() // sum token amounts
      : String(r.decodedResult))).catch(trace.catchError('0'));

    trace.update({
      state: TRACE_STATES.CLAIM_AMOUNT,
      claimAmount,
    });

    return claimAmount;
  }

  async preClaim(address, url, trace, contract) {
    const amount = await this.checkPreClaimProperties(address, url, trace, contract);

    if (amount.isZero()) return false;

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
          // Increase interval counter in the beginning
          intervalCounter++;
          try {
            if (intervalCounter > 20) {
              clearInterval(interval);
              return reject(Error('check_claim interval timeout'));
            }

            if ((await contract.methods.check_claim(url, address)).decodedResult.success) {
              clearInterval(interval);
              return resolve();
            }
          } catch (e) {
            if (!e.message.includes('MORE_ORACLE_ANSWERS_REQUIRED')) {
              logger.error(e);
            }
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
    if (process.env.CONTRACT_V2_ADDRESS) {
      return this.claimTipsOnContract(address, url, trace, this.contractV1).catch(logger.error)
        || this.claimTipsOnContract(address, url, trace, this.contractV2).catch(logger.error);
    }

    return this.claimTipsOnContract(address, url, trace, this.contractV1).catch(logger.error);
  }

  async claimTipsOnContract(address, url, trace, contract) {
    try {
      const claimSuccess = await this.preClaim(address, url, trace, contract);
      trace.update({ state: TRACE_STATES.FINAL_PRECLAIM_RESULT, claimSuccess });
      if (!claimSuccess) return null;
      const result = await contract.methods.claim(url, address, false);
      trace.update({ state: TRACE_STATES.CLAIM_RESULT, tx: result, result: result.decodedResult });
      return result.decodedResult;
    } catch (e) {
      if (e.message && e.message.includes('NO_ZERO_AMOUNT_PAYOUT')) return null; // ignoring this
      if (e.message && e.message.includes('URL_NOT_EXISTING')) throw new Error(`Could not find any tips for url ${url}`);
      if (e.message && e.message.includes('404: Account not found')) return logger.info(`User ${address} has balance 0`);
      throw new Error(e);
    }
  }

  async getAddressForChainName(name) {
    return this.client.aensQuery(name).catch(() => null);
  }

  async postTipToV3(title, media = [], author, signature) {
    return this.contractV3.methods.post_without_tip_sig(title, media, author, signature);
  }
}

const ae = new Aeternity();
module.exports = ae;
