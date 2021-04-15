const { Crypto } = require('@aeternity/aepp-sdk');
const tippingContractUtil = require('tipping-contract/util/tippingContractUtil');

const logger = require('../../../utils/logger')(module);
const aeternity = require('../../aeternity/logic/aeternity');
const CacheLogic = require('../../cache/logic/cacheLogic');
const TipLogic = require('../../tip/logic/tipLogic');
const Trace = require('./traceLogic');
const { TRACE_STATES } = require('../constants/traceStates');

module.exports = class PayForTxLogic {
  static async payForTx(req, res) {
    // Create new trace for each claim
    const trace = new Trace();
    trace.update({
      state: TRACE_STATES.REQUEST_RECEIVED,
    });

    // Helper functions
    const sendSuccess = () => {
      logger.info(`Pre-Claim check success for ${req.body.url} from address ${req.body.address}`);
      trace.update({
        state: TRACE_STATES.REQUEST_ANSWERED,
        answer: 'accepted',
      });
      return res.send({
        claimUUID: trace.id,
      });
    };

    const sendError = (status, message) => {
      if (!req.body) req.body = {};
      logger.info(`Rejecting claim for ${req.body.url} from ${req.body.address} with reason: ${message}`);
      trace.update({
        state: TRACE_STATES.REQUEST_ANSWERED,
        answer: 'rejected',
      });
      return res.status(status).send({ error: message });
    };

    // Basic sanity check
    if (!req.body) return sendError(400, 'no request body found');
    trace.update({
      state: TRACE_STATES.BODY_RECEIVED,
      body: req.body,
    });
    if (!req.body.url) return sendError(400, 'url not found in body');
    if (!req.body.address) return sendError(400, 'address not found in body');
    trace.update({
      state: TRACE_STATES.DATA_PARSED,
      url: req.body.url,
      address: req.body.address,
    });

    // Try to claim
    try {
      // Check sync if properties are okay
      const result = await aeternity.getTotalClaimableAmount(req.body.url, trace);

      // Verify result
      if (result.isZero()) return sendError(400, 'No zero amount claims');
      trace.setMetaData(req.body.url, req.body.address);

      // run claim async
      PayForTxLogic.runAsyncClaim(req.body.address, req.body.url, trace);

      return sendSuccess();
    } catch (e) {
      logger.error(e);
      return sendError(500, e.message);
    }
  }

  static async runAsyncClaim(address, url, trace) {
    try {
      await aeternity.claimTips(address, url, trace);
      CacheLogic.invalidateTipsCache();
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
  }

  static async postForUser(req, res) {
    const sendError = (status, message) => res.status(status).send({ error: message });

    if (!req.body.title) return sendError(400, 'title not found in body');
    if (!req.body.author) return sendError(400, 'author not found in body');
    if (!req.body.signature) return sendError(400, 'signature not found in body');
    const {
      title, media, author, signature: signatureInHex,
    } = req.body;

    const signature = Uint8Array.from(Buffer.from(signatureInHex, 'hex'));

    const hash = Crypto.hash(tippingContractUtil.postWithoutTippingString(title, media));
    const verified = Crypto.verifyPersonalMessage(hash, signature, Crypto.decodeBase58Check(author.substr(3)));
    if (!verified) {
      return sendError(401, 'The signature does not match the public key or the content');
    }

    try {
      const tx = await aeternity.postTipToV3(title, media, author, signature);
      await TipLogic.awaitTipsUpdated(`${tx.decodedResult}_v3`)
      return res.send({ tx });
    } catch (e) {
      return sendError(500, e.message);
    }
  }
};
