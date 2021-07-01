const { Crypto } = require('@aeternity/aepp-sdk');
const tippingContractUtil = require('tipping-contract/util/tippingContractUtil');

const logger = require('../../../utils/logger')(module);
const aeternity = require('../../aeternity/logic/aeternity');
const CacheLogic = require('../../cache/logic/cacheLogic');
const TipLogic = require('../../tip/logic/tipLogic');
const Trace = require('./traceLogic');
const { TRACE_STATES } = require('../constants/traceStates');

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
        answer: 'accepted',
      });
      return {
        claimUUID: trace.id,
      };
    };

    const sendError = (status, message) => {
      logger.info(`Rejecting claim for ${url} from ${address} with reason: ${message}`);
      trace.update({
        state: TRACE_STATES.REQUEST_ANSWERED,
        answer: 'rejected',
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
      if (result.isZero()) return sendError(400, 'No zero amount claims');
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
        result: 'success',
      });
    } catch (e) {
      trace.update({ state: TRACE_STATES.CAUGHT_ERROR, error: e.message });
      trace.finished({
        result: 'error',
      });
    }
  },

  async postForUser({
    title, media, author, signature,
  }) {
    const hash = Crypto.hash(tippingContractUtil.postWithoutTippingString(title, media));
    const verified = Crypto.verifyMessage(hash, signature, Crypto.decodeBase58Check(author.substr(3)));
    if (!verified) {
      return {
        error: 'The signature does not match the public key or the content',
        status: 401,
      };
    }
    const tx = await aeternity.postTipToV3(title, media, author, signature);
    await TipLogic.awaitTipsUpdated(`${tx.decodedResult}_v3`);
    return tx;
  },
};

module.exports = PayForTxLogic;
