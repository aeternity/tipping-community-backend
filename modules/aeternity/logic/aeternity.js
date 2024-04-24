import aeppSdk from "@aeternity/aepp-sdk";
import BigNumber from "bignumber.js";
import Sentry from "@sentry/node";
import esm from "esm";
import TIPPING_V1_INTERFACE from "tipping-contract/Tipping_v1_Interface.aes.js";
import TIPPING_V1_GETTER from "tipping-contract/Tipping_v1_Getter.aes.js";
import TIPPING_V2_INTERFACE from "tipping-contract/Tipping_v2_Interface.aes.js";
import TIPPING_V3_GETTER from "tipping-contract/Tipping_v3_Getter.aes.js";
import TIPPING_V3_INTERFACE from "tipping-contract/Tipping_v3_Interface.aes.js";
import TIPPING_V4_INTERFACE from "tipping-contract/Tipping_v4_Interface.aes.js";
import ORACLE_SERVICE_INTERFACE from "tipping-oracle-service/OracleServiceInterface.aes.js";
import ORACLE_GETTER from "tipping-oracle-service/OracleGetter.aes.js";
import TOKEN_CONTRACT_INTERFACE from "aeternity-fungible-token/FungibleTokenFullInterface.aes.js";
import TOKEN_REGISTRY from "token-registry/TokenRegistryInterface.aes.js";
import WORD_REGISTRY_INTERFACE from "wordbazaar-contracts/WordRegistryInterface.aes.js";
import WORD_SALE_INTERFACE from "wordbazaar-contracts/TokenSaleInterface.aes.js";
import TOKEN_VOTING_CONTRACT from "wordbazaar-contracts/TokenVotingInterface.aes.js";
import loggerFactory from "../../../utils/logger.js";
import basicTippingContractUtil from "../../../utils/basicTippingContractUtil.js";
import { TRACE_STATES } from "../../payfortx/constants/traceStates.js";
const { Universal, Node, MemoryAccount } = aeppSdk;
// import transformation  from "@aeternity/aepp-sdk/es/contract/aci/transformation.js"
// const { SOPHIA_TYPES, decodeEvents } = transformation;
// import transformation from '@aeternity/aepp-sdk/es/contract/aci/transformation.js';
// const { decodeEvents, SOPHIA_TYPES } = transformation;
// replace with dummy code
const decodeEvents = () => {};
const SOPHIA_TYPES = {};

const logger = loggerFactory(import.meta.url);
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
const tempCallOptions = { gas: 100000000000 };
const aeternity = {
  async init() {
    if (!client) {
      client = await Universal({
        nodes: [
          {
            name: "mainnetNode",
            instance: await Node({
              url: process.env.NODE_URL,
              internalUrl: process.env.NODE_URL,
            }),
          },
        ],
        accounts: [MemoryAccount({ keypair: { secretKey: process.env.PRIVATE_KEY, publicKey: process.env.PUBLIC_KEY } })],
        address: process.env.PUBLIC_KEY,
        compilerUrl: process.env.COMPILER_URL,
      });
      client.api.protectedDryRunTxs = client.api.dryRunTxs;
      contractV1 = await client.getContractInstance(TIPPING_V1_INTERFACE, { contractAddress: process.env.CONTRACT_V1_ADDRESS });
      if (process.env.CONTRACT_V1_GETTER_ADDRESS) {
        contractV1Getter = await client.getContractInstance(TIPPING_V1_GETTER, { contractAddress: process.env.CONTRACT_V1_GETTER_ADDRESS });
        logger.info("Starting WITH V1 GETTER contract");
      } else {
        logger.info("Starting WITHOUT V1 GETTER contract");
      }
      if (process.env.CONTRACT_V2_ADDRESS) {
        contractV2 = await client.getContractInstance(TIPPING_V2_INTERFACE, { contractAddress: process.env.CONTRACT_V2_ADDRESS });
        logger.info("Starting WITH V2 contract");
      } else {
        logger.info("Starting WITHOUT V2 contract");
      }
      if (process.env.CONTRACT_V3_GETTER_ADDRESS) {
        contractV3Getter = await client.getContractInstance(TIPPING_V3_GETTER, { contractAddress: process.env.CONTRACT_V3_GETTER_ADDRESS });
        logger.info("Starting WITH V3 GETTER contract");
      } else {
        logger.info("Starting WITHOUT V3 GETTER contract");
      }
      if (process.env.CONTRACT_V3_ADDRESS) {
        contractV3 = await client.getContractInstance(TIPPING_V3_INTERFACE, { contractAddress: process.env.CONTRACT_V3_ADDRESS });
        logger.info("Starting WITH V3 contract");
      } else {
        logger.info("Starting WITHOUT V3 contract");
      }
      if (process.env.CONTRACT_V4_ADDRESS) {
        contractV4 = await client.getContractInstance(TIPPING_V4_INTERFACE, { contractAddress: process.env.CONTRACT_V4_ADDRESS });
        logger.info("Starting WITH V4 contract");
      } else {
        logger.info("Starting WITHOUT V4 contract");
      }
      oracleContract = await client.getContractInstance(ORACLE_SERVICE_INTERFACE, { contractAddress: process.env.ORACLE_CONTRACT_ADDRESS });
      oracleGetter = await client.getContractInstance(ORACLE_GETTER, { contractAddress: process.env.ORACLE_GETTER_ADDRESS });
      if (process.env.WORD_REGISTRY_CONTRACT) {
        wordRegistryContract = await client.getContractInstance(WORD_REGISTRY_INTERFACE, { contractAddress: process.env.WORD_REGISTRY_CONTRACT });
        logger.info("Starting WITH WORD REGISTRY contract");
      } else {
        logger.info("Starting WITHOUT WORD REGISTRY contract");
      }
      tokenRegistry = await client.getContractInstance(TOKEN_REGISTRY, { contractAddress: process.env.TOKEN_REGISTRY_ADDRESS });
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
    return client.height();
  },
  async getBalance() {
    const address = await client.address();
    return client.getBalance(address);
  },
  decodeTransactionEventLog(log) {
    const eventsSchema = [
      { name: "TipReceived", types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
      {
        name: "TipTokenReceived",
        types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string, SOPHIA_TYPES.address],
      },
      { name: "ReTipReceived", types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
      {
        name: "ReTipTokenReceived",
        types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string, SOPHIA_TYPES.address],
      },
      { name: "TipWithdrawn", types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
      { name: "QueryOracle", types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address] },
      { name: "CheckPersistClaim", types: [SOPHIA_TYPES.string, SOPHIA_TYPES.address, SOPHIA_TYPES.int] },
      { name: "Transfer", types: [SOPHIA_TYPES.address, SOPHIA_TYPES.address, SOPHIA_TYPES.int] },
      { name: "Allowance", types: [SOPHIA_TYPES.address, SOPHIA_TYPES.address, SOPHIA_TYPES.int] },
      { name: "TipDirectReceived", types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string] },
      { name: "TipDirectTokenReceived", types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.string, SOPHIA_TYPES.address] },
      { name: "PostWithoutTipReceived", types: [SOPHIA_TYPES.address, SOPHIA_TYPES.string] },
    ];
    return (log ? decodeEvents(log, { schema: eventsSchema }) : []).map((decodedEvent) => {
      const event = {};
      switch (decodedEvent.name) {
        // AEX9
        case "Transfer":
          event.from = `ak_${decodedEvent.decoded[0]}`;
          event.to = `ak_${decodedEvent.decoded[1]}`;
          event.amount = decodedEvent.decoded[2] || null;
          break;
        case "Allowance":
          event.from = `ak_${decodedEvent.decoded[0]}`;
          event.for = `ak_${decodedEvent.decoded[1]}`;
          event.amount = decodedEvent.decoded[2] || null;
          break;
        // V2
        case "TipDirectReceived":
        case "TipDirectTokenReceived":
          event.address = `ak_${decodedEvent.decoded[0]}`;
          event.amount = decodedEvent.decoded[1] || null;
          event.receiver = decodedEvent.decoded[2]; // eslint-disable-line prefer-destructuring
          event.tokenContract = decodedEvent.decoded[3] || null;
          break;
        // V3
        case "PostWithoutTipReceived":
          event.address = `ak_${decodedEvent.decoded[0]}`;
          event.title = decodedEvent.decoded[1]; // eslint-disable-line prefer-destructuring
          break;
        // ORACLES
        case "CheckPersistClaim":
          event.address = `ak_${decodedEvent.decoded[1]}`;
          event.amount = decodedEvent.decoded[2] || null;
          event.url = decodedEvent.decoded[0]; // eslint-disable-line prefer-destructuring
          break;
        case "QueryOracle":
          event.address = `ak_${decodedEvent.decoded[1]}`;
          event.url = decodedEvent.decoded[0]; // eslint-disable-line prefer-destructuring
          break;
        case "TipReceived":
        case "TipTokenReceived":
        case "ReTipReceived":
        case "ReTipTokenReceived":
        case "TipWithdrawn":
          event.address = `ak_${decodedEvent.decoded[0]}`;
          event.amount = decodedEvent.decoded[1] ? decodedEvent.decoded[1] : null;
          event.url = decodedEvent.decoded[2]; // eslint-disable-line prefer-destructuring
          event.tokenContract = decodedEvent.decoded[3] || null;
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
    const tipId = await client.contractDecodeData("contract Decode =\n  entrypoint int(): int = 0", "int", value, "ok");
    const rawTip = await contractV2.methods.get_tip_by_id(tipId, tempCallOptions).then((res) => res.decodedResult);
    const url = await contractV2.methods.get_url_by_id(basicTippingContractUtil.rawTipUrlId(rawTip), tempCallOptions).then((res) => res.decodedResult);
    return basicTippingContractUtil.formatSingleTip(process.env.CONTRACT_V2_ADDRESS, "_v2", tipId, rawTip, url);
  },
  async getClaimV1V2(contract, url) {
    const contractGetter = contract === process.env.CONTRACT_V2_ADDRESS ? contractV2 : contractV1Getter;
    return contractGetter.methods.get_claim_by_url(contract, url, tempCallOptions).then((res) => basicTippingContractUtil.formatSingleClaim(contract, url, res.decodedResult));
  },
  async getTipV3(value) {
    const tipId = await client.contractDecodeData("contract Decode =\n  entrypoint int(): int = 0", "int", value, "ok");
    const rawTip = await contractV3Getter.methods.get_tip_by_id(process.env.CONTRACT_V3_ADDRESS, tipId, tempCallOptions).then((res) => res.decodedResult);
    return basicTippingContractUtil.formatSingleTip(process.env.CONTRACT_V3_ADDRESS, "_v3", tipId, rawTip);
  },
  async getTipV4(value) {
    const tipId = await client.contractDecodeData("contract Decode =\n  entrypoint int(): int = 0", "int", value, "ok");
    const rawTip = await contractV4.methods.get_tip_by_id(tipId, tempCallOptions).then((res) => res.decodedResult);
    return basicTippingContractUtil.formatSingleTip(process.env.CONTRACT_V4_ADDRESS, "_v4", tipId, rawTip);
  },
  async getRetipV2(value) {
    const retipId = await client.contractDecodeData("contract Decode =\n  entrypoint int(): int = 0", "int", value, "ok");
    return contractV2.methods.get_retip_by_id(retipId, tempCallOptions).then((res) => basicTippingContractUtil.formatSingleRetip(process.env.CONTRACT_V2_ADDRESS, "_v2", retipId, res.decodedResult));
  },
  decodeTransactionEvents(data) {
    const decodedEvents = aeternity.decodeTransactionEventLog(data.tx.log);
    return aeternity.flattenResultingEvents(decodedEvents, data);
  },
  flattenResultingEvents(events, data) {
    return events.map((decodedEvent) => ({
      event: decodedEvent.name,
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
    if (!client) throw new Error("Init sdk first");
    return wordRegistryContract.methods.get_state(tempCallOptions).then((res) => res.decodedResult);
  },
  async wordSaleTokenAddress(contractAddress) {
    await aeternity.initWordSaleContractIfUnknown(contractAddress);
    return wordSaleContracts[contractAddress].methods.get_token(tempCallOptions).then((res) => res.decodedResult);
  },
  async wordSaleState(contractAddress) {
    await aeternity.initWordSaleContractIfUnknown(contractAddress);
    return wordSaleContracts[contractAddress].methods.get_state(tempCallOptions).then((res) => res.decodedResult);
  },
  async wordSalePrice(contractAddress) {
    await aeternity.initWordSaleContractIfUnknown(contractAddress);
    return wordSaleContracts[contractAddress].methods.prices(tempCallOptions).then((res) => res.decodedResult);
  },
  async wordSaleVotes(contractAddress) {
    await aeternity.initWordSaleContractIfUnknown(contractAddress);
    return wordSaleContracts[contractAddress].methods.votes(tempCallOptions).then((res) => res.decodedResult);
  },
  async wordSaleVoteTimeout(contractAddress) {
    await aeternity.initWordSaleContractIfUnknown(contractAddress);
    return wordSaleContracts[contractAddress].methods.vote_timeout(tempCallOptions).then((res) => res.decodedResult);
  },
  async wordSaleVoteState(contractAddress) {
    await aeternity.initTokenVotingContractIfUnknown(contractAddress);
    return tokenVotingContracts[contractAddress].methods.get_state(tempCallOptions).then((res) => res.decodedResult);
  },
  async fungibleTokenTotalSupply(contractAddress) {
    await aeternity.initTokenContractIfUnknown(contractAddress);
    return tokenContracts[contractAddress].methods.total_supply(tempCallOptions).then((res) => res.decodedResult);
  },
  async fetchOracleClaimByUrl(url) {
    if (!client) throw new Error("Init sdk first");
    return oracleGetter.methods
      .get_oracle_claim_by_url(process.env.ORACLE_CONTRACT_ADDRESS, url, tempCallOptions)
      .then((res) => res.decodedResult)
      .catch((e) => {
        logger.error(e.message);
        Sentry.captureException(e);
        return [];
      });
  },
  async fetchOracleClaimedUrls(address) {
    if (!client) throw new Error("Init sdk first");
    return oracleGetter.methods
      .get_oracle_claimed_urls_by_account(process.env.ORACLE_CONTRACT_ADDRESS, address, tempCallOptions)
      .then((res) => res.decodedResult)
      .catch((e) => {
        logger.error(e.message);
        Sentry.captureException(e);
        return [];
      });
  },
  async getOracleAllClaimedUrls() {
    if (!client) throw new Error("Init sdk first");
    return oracleGetter.methods
      .get_oracle_claimed_urls(process.env.ORACLE_CONTRACT_ADDRESS, tempCallOptions)
      .then((res) => res.decodedResult)
      .catch((e) => {
        logger.error(e.message);
        Sentry.captureException(e);
        return [];
      });
  },
  async getUnsafeOracleAnswersForUrl(url) {
    return oracleContract.methods.unsafe_check_oracle_answers(url, tempCallOptions).then((x) => x.decodedResult);
  },
  async fetchStateBasic(onlyV1 = false) {
    if (!client) throw new Error("Init sdk first");
    try {
      const fetchV1State = contractV1.methods.get_state(tempCallOptions);
      const fetchV2State = !onlyV1 && process.env.CONTRACT_V2_ADDRESS ? contractV2.methods.get_state(tempCallOptions) : Promise.resolve(null);
      const fetchV3State = !onlyV1 && process.env.CONTRACT_V3_ADDRESS ? contractV3.methods.get_state(tempCallOptions) : Promise.resolve(null);
      const fetchV4State = !onlyV1 && process.env.CONTRACT_V4_ADDRESS ? contractV4.methods.get_state(tempCallOptions) : Promise.resolve(null);
      const states = [await fetchV1State, await fetchV2State, await fetchV3State, await fetchV4State].filter((state) => state);
      return {
        tips: basicTippingContractUtil.getTips(states),
        retips: basicTippingContractUtil.getRetips(states),
        claims: basicTippingContractUtil.getClaims(states),
      };
    } catch (e) {
      logger.error(e.message, e);
      Sentry.captureException(e);
      return { tips: [], retips: [], claims: [] };
    }
  },
  async fetchTokenRegistryState() {
    return tokenRegistry.methods
      .get_state(tempCallOptions)
      .then((r) => r.decodedResult)
      .catch((e) => {
        logger.error(e.message);
        Sentry.captureException(e);
        return [];
      });
  },
  async initTokenVotingContractIfUnknown(contractAddress) {
    if (!tokenVotingContracts[contractAddress]) {
      tokenVotingContracts[contractAddress] = await client.getContractInstance(TOKEN_VOTING_CONTRACT, { contractAddress });
    }
  },
  async initWordSaleContractIfUnknown(contractAddress) {
    if (!wordSaleContracts[contractAddress]) {
      wordSaleContracts[contractAddress] = await client.getContractInstance(WORD_SALE_INTERFACE, { contractAddress });
    }
  },
  async initTokenContractIfUnknown(contractAddress) {
    if (!tokenContracts[contractAddress]) {
      tokenContracts[contractAddress] = await client.getContractInstance(TOKEN_CONTRACT_INTERFACE, { contractAddress });
    }
  },
  async fetchTokenMetaInfo(contractAddress) {
    await aeternity.initTokenContractIfUnknown(contractAddress);
    return tokenContracts[contractAddress].methods
      .meta_info(tempCallOptions)
      .then((r) => r.decodedResult)
      .catch((e) => {
        logger.error(e.message);
        Sentry.captureException(e);
        return null;
      });
  },
  async addTokenToRegistry(contractAddress) {
    return tokenRegistry.methods.add_token(contractAddress).catch((e) => {
      logger.error(e.message);
      Sentry.captureException(e);
      return [];
    });
  },
  // TODO optimize cache generation for account balances
  async fetchTokenAccountBalances(contractAddress) {
    await aeternity.initTokenContractIfUnknown(contractAddress);
    return tokenContracts[contractAddress].methods
      .balances(tempCallOptions)
      .then((r) => r.decodedResult)
      .catch((e) => {
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
    const claimAmount = await contract.methods
      .unclaimed_for_url(url, tempCallOptions)
      .then((r) =>
        Array.isArray(r.decodedResult)
          ? r.decodedResult[1].reduce((acc, cur) => acc.plus(cur[1]), new BigNumber(r.decodedResult[0])) // sum token amounts
          : String(r.decodedResult),
      )
      .catch(trace.catchError(new BigNumber("0")));
    trace.update({
      state: TRACE_STATES.CLAIM_AMOUNT,
      claimAmount,
    });
    // cast to big number again to avoid IDE confusion
    return new BigNumber(claimAmount);
  },
  async checkClaimOnContract(address, url, trace, contract) {
    return contract.methods
      .check_claim(url, address, tempCallOptions)
      .then((r) => r.decodedResult.success)
      .catch(trace.catchError(false));
  },
  async preClaim(address, url, trace, contract) {
    const amount = await aeternity.getClaimableAmount(url, trace, contract);
    if (amount.isZero()) return false;
    // pre-claim if necessary (if not already claimed successfully)
    const claimSuccess = await aeternity.checkClaimOnContract(address, url, trace, contract);
    trace.update({ state: TRACE_STATES.INITIAL_PRECLAIM_RESULT, claimSuccess });
    if (!claimSuccess) {
      const fee = await oracleContract.methods.estimate_query_fee(tempCallOptions);
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
              return reject(Error("check_claim interval timeout"));
            }
            if (await aeternity.checkClaimOnContract(address, url, trace, contract)) {
              clearInterval(interval);
              return resolve(true);
            }
          } catch (e) {
            if (!e.message.includes("MORE_ORACLE_ANSWERS_REQUIRED")) {
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
    const result = await contract.methods.claim(url, address, false);
    trace.update({ state: TRACE_STATES.CLAIM_RESULT, tx: result, result: result.decodedResult });
    return result.decodedResult;
  },
  async claimTipsOnContract(address, url, trace, contract) {
    try {
      const claimSuccess = await aeternity.preClaim(address, url, trace, contract);
      trace.update({ state: TRACE_STATES.FINAL_PRECLAIM_RESULT, claimSuccess });
      if (!claimSuccess) return false;
      return await aeternity.claimOnContract(address, url, trace, contract);
    } catch (e) {
      if (e.message && e.message.includes("NO_ZERO_AMOUNT_PAYOUT")) return null; // ignoring this
      if (e.message && e.message.includes("URL_NOT_EXISTING")) throw new Error(`Could not find any tips for url ${url}`);
      if (e.message && e.message.includes("404: Account not found")) return logger.info(`User ${address} has balance 0`);
      throw new Error(e);
    }
  },
  async getAddressForChainName(name) {
    return client.aensQuery(name).catch(() => null);
  },
  async postTipToV3(title, media = [], author, signature) {
    return contractV3.methods.post_without_tip_sig(title, media, author, signature);
  },
  async fetchTx(hash) {
    return client.getTxInfo(hash);
  },
  contractAddressForVersion(version) {
    switch (version) {
      case "v1":
        return process.env.CONTRACT_V1_ADDRESS;
      case "v2":
        return process.env.CONTRACT_V2_ADDRESS;
      case "v3":
        return process.env.CONTRACT_V3_ADDRESS;
      case "v4":
        return process.env.CONTRACT_V4_ADDRESS;
      default:
        return "";
    }
  },
};
export default aeternity;
