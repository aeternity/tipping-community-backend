const logger = require('../utils/logger')(module);
const ae = require('../utils/aeternity.js');
const CacheLogic = require('./cacheLogic');
const Trace = require('../utils/trace');
const { TRACE_STATES } = require('../models/enums/trace');

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
    if (!ae || !ae.client) return sendError(500, 'sdk not initialized yet');
    trace.update({
      state: TRACE_STATES.DATA_PARSED,
      url: req.body.url,
      address: req.body.address,
    });

    // Try to claim
    try {
      // Check sync if properties are okay
      const result = await ae.checkPreClaimProperties(req.body.address, req.body.url, trace);

      // run claim async
      PayForTxLogic.runAsyncClaim(req.body.address, req.body.url, trace);

      if (result.isZero()) return sendError(400, 'No zero amount claims');
      if (!result) return sendError(400, 'Claim rejected');
      trace.setMetaData(req.body.url, req.body.address);
      return sendSuccess();
    } catch (e) {
      logger.error(e);
      return sendError(500, e.message);
    }
  }

  static async runAsyncClaim(address, url, trace) {
    try {
      await ae.claimTips(address, url, trace);
      CacheLogic.invalidateTips();
      CacheLogic.invalidateOracle();
      CacheLogic.invalidateContractEvents();
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
};
