import tippingContractUtil from "tipping-contract/util/tippingContractUtil.js";
import loggerFactory from "../../../utils/logger.js";
import aeternity from "../../aeternity/logic/aeternity.js";
import CacheLogic from "../../cache/logic/cacheLogic.js";
import TipLogic from "../../tip/logic/tipLogic.js";
import Trace from "./traceLogic.js";
import { TRACE_STATES } from "../constants/traceStates.js";
import { hash, verifyMessage } from "@aeternity/aepp-sdk";
const logger = loggerFactory(import.meta.url);
const PayForTxLogic = {
  async claimTip(url, address) {
    // Create new trace for each claim
    const trace = new Trace();
    trace.update({
      state: TRACE_STATES.REQUEST_RECEIVED,
    });
    // Helper functions
    const sendSuccess = () => {
      logger.info(`Pre-Claim check success for ${url} from address ${address}`);
      trace.update({
        state: TRACE_STATES.REQUEST_ANSWERED,
        answer: "accepted",
      });
      return {
        claimUUID: trace.id,
      };
    };
    const sendError = (status, message) => {
      logger.info(`Rejecting claim for ${url} from ${address} with reason: ${message}`);
      trace.update({
        state: TRACE_STATES.REQUEST_ANSWERED,
        answer: "rejected",
      });
      return { error: message, status };
    };
    // Basic sanity check
    trace.update({
      state: TRACE_STATES.DATA_PARSED,
      url,
      address,
    });
    // Try to claim
    try {
      // Check sync if properties are okay
      const result = await aeternity.getTotalClaimableAmount(url, trace);
      // Verify result
      if (result.isZero()) return sendError(400, "No zero amount claims");
      trace.setMetaData(url, address);
      // run claim async
      PayForTxLogic.runAsyncClaim(address, url, trace);
      return sendSuccess();
    } catch (e) {
      logger.error(e);
      return sendError(500, e.message);
    }
  },
  async runAsyncClaim(address, url, trace) {
    try {
      await aeternity.claimTips(address, url, trace);
      CacheLogic.invalidateOracle();
      trace.finished({
        result: "success",
      });
    } catch (e) {
      trace.update({ state: TRACE_STATES.CAUGHT_ERROR, error: e.message });
      trace.finished({
        result: "error",
      });
    }
  },
  async postForUser({ title, media, author, signature }) {
    const hashResult = hash(tippingContractUtil.postWithoutTippingString(title, media));
    const verified = verifyMessage(hashResult.toString(), signature, author);
    if (!verified) {
      return {
        error: "The signature does not match the public key or the content",
        status: 401,
      };
    }
    const tx = await aeternity.postTipToV3(title, media, author, signature);
    await TipLogic.awaitTipsUpdated(`${tx.decodedResult}_v3`);
    return tx;
  },
};
export default PayForTxLogic;
