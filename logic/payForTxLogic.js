const Logger = require('../utils/logger.js');
const ae = require('../utils/aeternity.js');
const CacheLogic = require('../logic/cacheLogic');
const TracingLogic = require('../logic/tracingLogic');

const logger = new Logger('payForTx');

module.exports = class PayForTxLogic {

  static async payForTx (req, res) {

    // Create new trace for each claim
    const trace = new TracingLogic();
    trace.update({
      state: TracingLogic.state.REQUEST_RECEIVED
    })

    // Helper functions
    const sendSuccess = () => {
      logger.log({ success: true, url: req.body.url, address: req.body.address, status: 200, message: '' });
      trace.update({
        state: TracingLogic.state.REQUEST_ANSWERED,
        answer: 'accepted'
      })
      return res.sendStatus(200);
    }

    const sendError = (status, message) => {
      if (!req.body) req.body = {};
      logger.log({ success: false, url: req.body.url, address: req.body.address, status: status, message: message });
      trace.update({
        state: TracingLogic.state.REQUEST_ANSWERED,
        answer: 'rejected'
      })
      return res.status(status).send({ error: message });
    }


    // Basic sanity check
    if (!req.body) return sendError(400, 'no request body found');
    trace.update({
      state: TracingLogic.state.BODY_RECEIVED,
      body: req.body,
    })
    if (!req.body.url) return sendError(400, 'url not found in body');
    if (!req.body.address) return sendError( 400, 'address not found in body');
    if (!ae || !ae.client) return sendError(500, 'sdk not initialized yet');
    trace.update({
      state: TracingLogic.state.DATA_PARSED,
      url: req.body.url,
      address: req.body.address
    })

    // Try to claim
    try {
      // Check sync if properties are okay
      const result = await ae.checkPreClaim(req.body.address, req.body.url, trace);

      // run claim async
      PayForTxLogic.runAsyncClaim(req.body.address, req.body.url, trace)

      if(!result) return sendError(400, 'Claim rejected');
      return sendSuccess();
    } catch (e) {
      console.error(e);
      return sendError(500, e.message);
    }
  }

  static async runAsyncClaim(address, url, trace) {
    try {
      await ae.claimTips(address, url, trace)
      CacheLogic.invalidateTips();
      CacheLogic.invalidateOracle();
      CacheLogic.invalidateContractEvents();
      trace.finished({
        result: 'success'
      })
    } catch (e) {
      trace.update({ state: TracingLogic.state.CAUGHT_ERROR, error: e.message });
      trace.finished({
        result: 'error'
      })
    }
  }

};
