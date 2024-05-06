const { AciContractCallEncoder } = require('@aeternity/aepp-calldata');
const { Node, MemoryAccount, AeSdk } = require('@aeternity/aepp-sdk');
const BigNumber = require('bignumber.js');
const Sentry = require('@sentry/node');

const TIPPING_V1_ACI = require('tipping-contract/generated/Tipping_v1.aci.json');
const TIPPING_V1_GETTER_ACI = require('tipping-contract/generated/Tipping_v1_Getter.aci.json');
const TIPPING_V2_ACI = require('tipping-contract/generated/Tipping_v2.aci.json');
const TIPPING_V3_ACI = require('tipping-contract/generated/Tipping_v3.aci.json');
const TIPPING_V3_GETTER_ACI = require('tipping-contract/generated/Tipping_v3_Getter.aci.json');
const TIPPING_V4_ACI = require('tipping-contract/generated/Tipping_v4.aci.json');
const ORACLE_SERVICE_ACI = require('tipping-oracle-service/generated/OracleService.aci.json');
const ORACLE_GETTER_ACI = require('tipping-oracle-service/generated/OracleGetter.aci.json');
const FUNGIBLE_TOKEN_FULL_ACI = require('aeternity-fungible-token/generated/FungibleTokenFull.aci.json');
const TOKEN_REGISTRY_ACI = require('token-registry/generated/token-registry.aci.json');
const WORD_REGISTRY_ACI = require('wordbazaar-contracts/generated/WordRegistry.aci.json');
const WORD_SALE_ACI = require('wordbazaar-contracts/generated/TokenSale.aci.json');
const TOKEN_VOTING_ACI = require('wordbazaar-contracts/generated/TokenVoting.aci.json');

const logger = require('../../../utils/logger')(module);
const basicTippingContractUtil = require('../../../utils/basicTippingContractUtil');
const { TRACE_STATES } = require('../../payfortx/constants/traceStates');

// private
let client;
let contractV1;
let contractV1Getter;
let contractV2;
let contractV3;
let contractV3Getter;
let contractV4;
let oracleContract;
let oracleGetter;
let wordRegistryContract;
let tokenRegistry;
const tokenContracts = {};
const wordSaleContracts = {};
const tokenVotingContracts = {};

class CustomNode extends Node {
  url;

  constructor(url) {
    super(url);
    this.url = url;
  }

  sendOperationRequest(args, spec) {
    if (spec.path === '/v3/dry-run') {
      // eslint-disable-next-line no-param-reassign
      spec = {
        ...spec,
        path: `${this.url}/v3/debug/transactions/dry-run`,
      };
    }
    return super.sendOperationRequest(args, spec);
  }
}

const aeternity = {
  async init() {
    if (!client) {
      client = new AeSdk({
        nodes: [
          {
            name: 'mainnetNode',
            instance: new CustomNode(process.env.NODE_URL),
          },
        ],
        accounts: [new MemoryAccount(process.env.PRIVATE_KEY)],
        address: process.env.PUBLIC_KEY,
      });

      contractV1 = await client.initializeContract({
        aci: TIPPING_V1_ACI,
        address: process.env.CONTRACT_V1_ADDRESS,
      });
      if (process.env.CONTRACT_V1_GETTER_ADDRESS) {
        contractV1Getter = await client.initializeContract({
          aci: TIPPING_V1_GETTER_ACI,
          address: process.env.CONTRACT_V1_GETTER_ADDRESS,
        });
        logger.info('Starting WITH V1 GETTER contract');
      } else {
        logger.info('Starting WITHOUT V1 GETTER contract');
      }

      if (process.env.CONTRACT_V2_ADDRESS) {
        contractV2 = await client.initializeContract({
          aci: TIPPING_V2_ACI,
          address: process.env.CONTRACT_V2_ADDRESS,
        });
        logger.info('Starting WITH V2 contract');
      } else {
        logger.info('Starting WITHOUT V2 contract');
      }

      if (process.env.CONTRACT_V3_GETTER_ADDRESS) {
        contractV3Getter = await client.initializeContract({
          aci: TIPPING_V3_GETTER_ACI,
          address: process.env.CONTRACT_V3_GETTER_ADDRESS,
        });
        logger.info('Starting WITH V3 GETTER contract');
      } else {
        logger.info('Starting WITHOUT V3 GETTER contract');
      }

      if (process.env.CONTRACT_V3_ADDRESS) {
        contractV3 = await client.initializeContract({
          aci: TIPPING_V3_ACI,
          address: process.env.CONTRACT_V3_ADDRESS,
        });
        logger.info('Starting WITH V3 contract');
      } else {
        logger.info('Starting WITHOUT V3 contract');
      }

      if (process.env.CONTRACT_V4_ADDRESS) {
        contractV4 = await client.initializeContract({
          aci: TIPPING_V4_ACI,
          address: process.env.CONTRACT_V4_ADDRESS,
        });
        logger.info('Starting WITH V4 contract');
      } else {
        logger.info('Starting WITHOUT V4 contract');
      }
      oracleContract = await client.initializeContract({
        aci: ORACLE_SERVICE_ACI,
        address: process.env.ORACLE_CONTRACT_ADDRESS,
      });
      oracleGetter = await client.initializeContract({
        aci: ORACLE_GETTER_ACI,
        address: process.env.ORACLE_GETTER_ADDRESS,
      });
      tokenRegistry = await client.initializeContract({
        aci: TOKEN_REGISTRY_ACI,
        address: process.env.TOKEN_REGISTRY_ADDRESS,
      });
      if (process.env.WORD_REGISTRY_CONTRACT) {
        wordRegistryContract = await client.initializeContract({
          aci: WORD_REGISTRY_ACI,
          address: process.env.WORD_REGISTRY_CONTRACT,
        });
        logger.info('Starting WITH WORD REGISTRY contract');
      } else {
        logger.info('Starting WITHOUT WORD REGISTRY contract');
      }
    }
  },

  getClient() {
    return client;
  },

  async resetClient() {
    client = null;
    await aeternity.init();
  },

  async networkId() {
    return (await client.getNodeInfo()).nodeNetworkId;
  },

  async getHeight() {
    return client.getHeight();
  },

  async getBalance() {
    const address = await client.address();
    return client.getBalance(address);
  },
  decodeEvents(logs, aci, contractName) {
    return logs
      .map(log => {
        try {
          const event = Object.entries(
            new AciContractCallEncoder(aci).decodeEvent(
              contractName,
              log.data,
              log.topics.map(topic => BigInt(topic)),
            ),
          )[0];

          return {
            address: log.address,
            name: event[0],
            args: event[1],
          };
        } catch (e) {
          return null;
        }
      })
      .filter(e => !!e);
  },
  decodeTransactionEventLog(log) {
    // probably a of tx that do not have logs
    if (!log || !log.length) return [];

    const decodedEvents = [
      ...aeternity.decodeEvents(log, FUNGIBLE_TOKEN_FULL_ACI, 'FungibleTokenFull'),
      ...((process.env.CONTRACT_V1_ADDRESS && aeternity.decodeEvents(log, TIPPING_V1_ACI, 'Tipping')) || []),
      ...((process.env.CONTRACT_V2_ADDRESS && aeternity.decodeEvents(log, TIPPING_V2_ACI, 'Tipping')) || []),
      ...((process.env.CONTRACT_V3_ADDRESS && aeternity.decodeEvents(log, TIPPING_V3_ACI, 'Tipping')) || []),
      ...((process.env.CONTRACT_V4_ADDRESS && aeternity.decodeEvents(log, TIPPING_V4_ACI, 'Tipping')) || []),
      ...aeternity.decodeEvents(log, ORACLE_SERVICE_ACI, 'OracleService'),
      ...aeternity.decodeEvents(log, TOKEN_REGISTRY_ACI, 'TokenRegistry'),
    ].filter((value, index, self) => index === self.findIndex(t => (
      // DEDUPLICATE
      t.place === value.place && JSON.stringify(t) === JSON.stringify(value)
    )));

    return decodedEvents.map(decodedEvent => {
      const event = {};
      // Decode AEX9 events
      switch (decodedEvent.name) {
        // AEX9
        case 'Transfer':
          event.from = decodedEvent.args[0]; // eslint-disable-line prefer-destructuring
          event.to = decodedEvent.args[1]; // eslint-disable-line prefer-destructuring
          event.amount = decodedEvent.args[2] ? Number(decodedEvent.args[2]) : null;
          break;
        case 'Allowance':
          event.from = decodedEvent.args[0]; // eslint-disable-line prefer-destructuring
          event.for = decodedEvent.args[1]; // eslint-disable-line prefer-destructuring
          event.amount = decodedEvent.args[2] ? Number(decodedEvent.args[2]) : null;
          break;

          // V2
        case 'TipDirectReceived':
        case 'TipDirectTokenReceived':
          event.address = decodedEvent.args[0]; // eslint-disable-line prefer-destructuring
          event.amount = decodedEvent.args[1] ? Number(decodedEvent.args[1]) : null;
          event.receiver = decodedEvent.args[2]; // eslint-disable-line prefer-destructuring
          event.tokenContract = decodedEvent.args[3] || null;
          break;

          // V3
        case 'PostWithoutTipReceived':
          event.address = decodedEvent.args[0]; // eslint-disable-line prefer-destructuring
          event.title = decodedEvent.args[1]; // eslint-disable-line prefer-destructuring
          break;

          // ORACLES
        case 'CheckPersistClaim':
          event.address = decodedEvent.args[1]; // eslint-disable-line prefer-destructuring
          event.amount = decodedEvent.args[2] ? Number(decodedEvent.args[2]) : null;
          event.url = decodedEvent.args[0]; // eslint-disable-line prefer-destructuring
          break;
        case 'QueryOracle':
          event.address = decodedEvent.args[1]; // eslint-disable-line prefer-destructuring
          event.url = decodedEvent.args[0]; // eslint-disable-line prefer-destructuring
          break;

        case 'TipReceived':
        case 'TipTokenReceived':
        case 'ReTipReceived':
        case 'ReTipTokenReceived':
        case 'TipWithdrawn':
          event.address = decodedEvent.args[0]; // eslint-disable-line prefer-destructuring
          event.amount = decodedEvent.args[1] ? Number(decodedEvent.args[1]) : null;
          event.url = decodedEvent.args[2]; // eslint-disable-line prefer-destructuring
          event.tokenContract = decodedEvent.args[3] || null;
          break;
        default:
          logger.warn(`Could not process event ${decodedEvent.name}`);
          break;
      }
      return {
        parsedEvent: event,
        ...decodedEvent,
      };
    });
  },

  async getTipV2(value) {
    // TODO deal with tipId here
    const tipId = await client.contractDecodeData('contract Decode =\n  entrypoint int(): int = 0', 'int', value, 'ok');
    const rawTip = await contractV2.get_tip_by_id(tipId).then(res => res.decodedResult);
    const url = await contractV2.get_url_by_id(basicTippingContractUtil.rawTipUrlId(rawTip)).then(res => res.decodedResult);
    return basicTippingContractUtil.formatSingleTip(process.env.CONTRACT_V2_ADDRESS, '_v2', tipId, rawTip, url);
  },

  async getClaimV1V2(contract, url) {
    const contractGetter = contract === process.env.CONTRACT_V2_ADDRESS ? contractV2 : contractV1Getter;
    return contractGetter.get_claim_by_url(contract, url).then(res => basicTippingContractUtil.formatSingleClaim(contract, url, res.decodedResult));
  },

  async getTipV3(value) {
    const tipId = await client.contractDecodeData('contract Decode =\n  entrypoint int(): int = 0', 'int', value, 'ok');
    const rawTip = await contractV3Getter.get_tip_by_id(process.env.CONTRACT_V3_ADDRESS, tipId).then(res => res.decodedResult);
    return basicTippingContractUtil.formatSingleTip(process.env.CONTRACT_V3_ADDRESS, '_v3', tipId, rawTip);
  },

  async getTipV4(value) {
    const tipId = await client.contractDecodeData('contract Decode =\n  entrypoint int(): int = 0', 'int', value, 'ok');
    const rawTip = await contractV4.get_tip_by_id(tipId).then(res => res.decodedResult);
    return basicTippingContractUtil.formatSingleTip(process.env.CONTRACT_V4_ADDRESS, '_v4', tipId, rawTip);
  },

  async getRetipV2(value) {
    const retipId = await client.contractDecodeData('contract Decode =\n  entrypoint int(): int = 0', 'int', value, 'ok');
    return contractV2.get_retip_by_id(retipId)
      .then(res => basicTippingContractUtil.formatSingleRetip(process.env.CONTRACT_V2_ADDRESS, '_v2', retipId, res.decodedResult));
  },

  decodeTransactionEvents(data) {
    const decodedEvents = aeternity.decodeTransactionEventLog(data.tx.log);
    return aeternity.flattenResultingEvents(decodedEvents, data);
  },

  flattenResultingEvents(events, data) {
    return events.map(decodedEvent => ({
      event: decodedEvent.name, // Deprecated property TODO remove
      name: decodedEvent.name,
      caller: data.tx.caller_id,
      nonce: data.tx.nonce,
      height: data.block_height,
      hash: data.hash,
      time: data.micro_time,
      contract: data.tx.contract_id,
      ...decodedEvent.parsedEvent,
      data,
    }));
  },

  async fetchWordRegistryData() {
    if (!client) throw new Error('Init sdk first');
    return wordRegistryContract.get_state().then(res => res.decodedResult);
  },

  async wordSaleTokenAddress(contractAddress) {
    await aeternity.initWordSaleContractIfUnknown(contractAddress);
    return wordSaleContracts[contractAddress].get_token().then(res => res.decodedResult);
  },

  async wordSaleState(contractAddress) {
    await aeternity.initWordSaleContractIfUnknown(contractAddress);
    return wordSaleContracts[contractAddress].get_state().then(res => res.decodedResult);
  },

  async wordSalePrice(contractAddress) {
    await aeternity.initWordSaleContractIfUnknown(contractAddress);
    return wordSaleContracts[contractAddress].prices().then(res => res.decodedResult);
  },

  async wordSaleVotes(contractAddress) {
    await aeternity.initWordSaleContractIfUnknown(contractAddress);
    return wordSaleContracts[contractAddress].votes().then(res => Array.from(res.decodedResult));
  },

  async wordSaleVoteTimeout(contractAddress) {
    await aeternity.initWordSaleContractIfUnknown(contractAddress);
    return wordSaleContracts[contractAddress].vote_timeout().then(res => res.decodedResult);
  },

  async wordSaleVoteState(contractAddress) {
    await aeternity.initTokenVotingContractIfUnknown(contractAddress);
    return tokenVotingContracts[contractAddress].get_state().then(res => res.decodedResult);
  },

  async fungibleTokenTotalSupply(contractAddress) {
    await aeternity.initTokenContractIfUnknown(contractAddress);
    return tokenContracts[contractAddress].total_supply().then(res => res.decodedResult);
  },

  async fetchOracleClaimByUrl(url) {
    if (!client) throw new Error('Init sdk first');
    return oracleGetter
      .get_oracle_claim_by_url(process.env.ORACLE_CONTRACT_ADDRESS, url)
      .then(res => res.decodedResult)
      .catch(e => {
        logger.error(e.message);
        Sentry.captureException(e);
        return [];
      });
  },

  async fetchOracleClaimedUrls(address) {
    if (!client) throw new Error('Init sdk first');
    return oracleGetter
      .get_oracle_claimed_urls_by_account(process.env.ORACLE_CONTRACT_ADDRESS, address)
      .then(res => res.decodedResult)
      .catch(e => {
        logger.error(e.message);
        Sentry.captureException(e);
        return [];
      });
  },

  async getOracleAllClaimedUrls() {
    if (!client) throw new Error('Init sdk first');
    return oracleGetter
      .get_oracle_claimed_urls(process.env.ORACLE_CONTRACT_ADDRESS)
      .then(res => res.decodedResult)
      .catch(e => {
        logger.error(e.message);
        Sentry.captureException(e);
        return [];
      });
  },

  async getUnsafeOracleAnswersForUrl(url) {
    return oracleContract.unsafe_check_oracle_answers(url).then(x => x.decodedResult);
  },

  async fetchStateBasic(onlyV1 = false) {
    if (!client) throw new Error('Init sdk first');
    try {
      const fetchV1State = contractV1.get_state({
        gasMax: 11e18,
        gasLimit: 10e18,
      });
      const fetchV2State = !onlyV1 && process.env.CONTRACT_V2_ADDRESS
        ? contractV2.get_state({
          gasMax: 11e18,
          gasLimit: 10e18,
        })
        : Promise.resolve(null);
      const fetchV3State = !onlyV1 && process.env.CONTRACT_V3_ADDRESS
        ? contractV3.get_state({
          gasMax: 11e18,
          gasLimit: 10e18,
        })
        : Promise.resolve(null);
      const fetchV4State = !onlyV1 && process.env.CONTRACT_V4_ADDRESS
        ? contractV4.get_state({
          gasMax: 11e18,
          gasLimit: 10e18,
        })
        : Promise.resolve(null);
      const states = [await fetchV1State, await fetchV2State, await fetchV3State, await fetchV4State].filter(state => state);
      return {
        tips: basicTippingContractUtil.getTips(states),
        retips: basicTippingContractUtil.getRetips(states),
        claims: basicTippingContractUtil.getClaims(states),
      };
    } catch (e) {
      logger.error(e.message, e);
      Sentry.captureException(e);
      return {
        tips: [],
        retips: [],
        claims: [],
      };
    }
  },

  async fetchTokenRegistryState() {
    return tokenRegistry
      .get_state()
      .then(r => Array.from(r.decodedResult))
      .catch(e => {
        logger.error(e.message);
        Sentry.captureException(e);
        return [];
      });
  },

  async initTokenVotingContractIfUnknown(contractAddress) {
    if (!tokenVotingContracts[contractAddress]) {
      tokenVotingContracts[contractAddress] = await client.initializeContract({ aci: TOKEN_VOTING_ACI, address: contractAddress });
    }
  },

  async initWordSaleContractIfUnknown(contractAddress) {
    if (!wordSaleContracts[contractAddress]) {
      wordSaleContracts[contractAddress] = await client.initializeContract({ aci: WORD_SALE_ACI, address: contractAddress });
    }
  },

  async initTokenContractIfUnknown(contractAddress) {
    if (!tokenContracts[contractAddress]) {
      tokenContracts[contractAddress] = await client.initializeContract({ aci: FUNGIBLE_TOKEN_FULL_ACI, address: contractAddress });
    }
  },

  async fetchTokenMetaInfo(contractAddress) {
    await aeternity.initTokenContractIfUnknown(contractAddress);
    return tokenContracts[contractAddress]
      .meta_info()
      .then(r => r.decodedResult)
      .catch(e => {
        logger.error(e.message);
        Sentry.captureException(e);
        return null;
      });
  },

  async addTokenToRegistry(contractAddress) {
    return tokenRegistry.add_token(contractAddress).catch(e => {
      logger.error(e.message);
      Sentry.captureException(e);
      return [];
    });
  },

  // TODO optimize cache generation for account balances
  async fetchTokenAccountBalances(contractAddress) {
    await aeternity.initTokenContractIfUnknown(contractAddress);
    return tokenContracts[contractAddress]
      .balances()
      .then(r => Array.from(r.decodedResult))
      .catch(e => {
        logger.error(e.message);
        Sentry.captureException(e);
        return null;
      });
  },

  async getTotalClaimableAmount(url, trace) {
    const amountV1 = await aeternity.getClaimableAmount(url, trace, contractV1);
    if (contractV2) {
      const amountV2 = await aeternity.getClaimableAmount(url, trace, contractV2);
      return amountV1.plus(amountV2);
    }
    return amountV1;
  },

  async getClaimableAmount(url, trace, contract) {
    trace.update({
      state: TRACE_STATES.STARTED_PRE_CLAIM,
    });
    const claimAmount = await contract
      .unclaimed_for_url(url)
      .then(r => (Array.isArray(r.decodedResult)
        ? r.decodedResult[1].reduce((acc, cur) => acc.plus(cur[1]), new BigNumber(r.decodedResult[0])) // sum token amounts
        : String(r.decodedResult)))
      .catch(trace.catchError(new BigNumber('0')));
    trace.update({
      state: TRACE_STATES.CLAIM_AMOUNT,
      claimAmount,
    });

    // cast to big number again to avoid IDE confusion
    return new BigNumber(claimAmount);
  },

  async checkClaimOnContract(address, url, trace, contract) {
    return contract
      .check_claim(url, address)
      .then(r => r.decodedResult.success)
      .catch(trace.catchError(false));
  },

  async preClaim(address, url, trace, contract) {
    const amount = await aeternity.getClaimableAmount(url, trace, contract);

    if (amount.isZero()) return false;

    // pre-claim if necessary (if not already claimed successfully)
    const claimSuccess = await aeternity.checkClaimOnContract(address, url, trace, contract);
    trace.update({
      state: TRACE_STATES.INITIAL_PRECLAIM_RESULT,
      claimSuccess,
    });
    if (!claimSuccess) {
      const fee = await oracleContract.estimate_query_fee();
      trace.update({
        state: TRACE_STATES.ESTIMATED_FEE,
        fee: fee.decodedResult,
      });
      await contract.pre_claim(url, address, { amount: fee.decodedResult });
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

            if (await aeternity.checkClaimOnContract(address, url, trace, contract)) {
              clearInterval(interval);
              return resolve(true);
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
  },

  async claimTips(address, url, trace) {
    if (process.env.CONTRACT_V2_ADDRESS) {
      const v1Claim = await aeternity.claimTipsOnContract(address, url, trace, contractV1).catch(logger.error);
      const v2Claim = await aeternity.claimTipsOnContract(address, url, trace, contractV2).catch(logger.error);
      return v1Claim || v2Claim;
    }

    return !!aeternity.claimTipsOnContract(address, url, trace, contractV1).catch(logger.error);
  },

  async claimOnContract(address, url, trace, contract) {
    const result = await contract.claim(url, address, false);
    trace.update({
      state: TRACE_STATES.CLAIM_RESULT,
      tx: result,
      result: result.decodedResult,
    });
    return result.decodedResult;
  },

  async claimTipsOnContract(address, url, trace, contract) {
    try {
      const claimSuccess = await aeternity.preClaim(address, url, trace, contract);
      trace.update({
        state: TRACE_STATES.FINAL_PRECLAIM_RESULT,
        claimSuccess,
      });
      if (!claimSuccess) return false;
      return await aeternity.claimOnContract(address, url, trace, contract);
    } catch (e) {
      if (e.message && e.message.includes('NO_ZERO_AMOUNT_PAYOUT')) return null; // ignoring this
      if (e.message && e.message.includes('URL_NOT_EXISTING')) throw new Error(`Could not find any tips for url ${url}`);
      if (e.message && e.message.includes('404: Account not found')) return logger.info(`User ${address} has balance 0`);
      throw new Error(e);
    }
  },

  async getAddressForChainName(name) {
    return client.aensQuery(name).catch(() => null);
  },

  async postTipToV3(title, media = [], author, signature) {
    return contractV3.post_without_tip_sig(title, media, author, signature);
  },

  async fetchTx(hash) {
    return client.pool.values().next().value.getTransactionInfoByHash(hash);
  },

  contractAddressForVersion(version) {
    switch (version) {
      case 'v1':
        return process.env.CONTRACT_V1_ADDRESS;
      case 'v2':
        return process.env.CONTRACT_V2_ADDRESS;
      case 'v3':
        return process.env.CONTRACT_V3_ADDRESS;
      case 'v4':
        return process.env.CONTRACT_V4_ADDRESS;
      default:
        return '';
    }
  },
};

module.exports = aeternity;
