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
      trace.finished({
        result: 'success',
      })
      return res.sendStatus(200);
    }

    const sendError = (status, message) => {
      if (!req.body) req.body = {};
      logger.log({ success: false, url: req.body.url, address: req.body.address, status: status, message: message });
      trace.finished({
        result: 'failed',
        reason: message
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
      const result = await ae.claimTips(req.body.address, req.body.url, trace);
      CacheLogic.invalidateTips();
      CacheLogic.invalidateOracle();
      CacheLogic.invalidateContractEvents();
      // TODO save tx hash to log
      if(!result) return sendError(400, 'Claim rejected');
      return sendSuccess();
    } catch (e) {
      console.error(e);
      return sendError(500, e.message);
    }


  }


};
