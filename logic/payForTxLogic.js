const Logger = require('../utils/logger.js');
const ae = require('../utils/aeternity.js');
const CacheLogic = require('../logic/cacheLogic');

const logger = new Logger('payForTx');

module.exports = class PayForTxLogic {

  static async payForTx (req, res) {
    if (!req.body) return PayForTxLogic.sendError(req, res, 400, 'no request body found');
    if (!req.body.url) return PayForTxLogic.sendError(req, res, 400, 'url not found in body');
    if (!req.body.address) return PayForTxLogic.sendError(req, res, 400, 'address not found in body');
    if (!ae || !ae.client) return PayForTxLogic.sendError(req, res, 500, 'sdk not initialized yet');

    try {
      const result = await ae.claimTips(req.body.address, req.body.url);
      CacheLogic.invalidateTips();
      CacheLogic.invalidateOracle();
      CacheLogic.invalidateWithdrawnTipEvents();
      // TODO save tx hash to log
      return PayForTxLogic.sendSuccess(req, res);
    } catch (e) {
      console.error(e);
      return PayForTxLogic.sendError(req, res, 500, e.message);
    }
  }

  static sendSuccess (req, res) {
    logger.log({ success: true, url: req.body.url, address: req.body.address, status: 200, message: '' });
    return res.sendStatus(200);
  }

  static sendError (req, res, status, message) {
    if (!req.body) req.body = {};
    logger.log({ success: false, url: req.body.url, address: req.body.address, status: status, message: message });
    return res.status(status).send({ error: message });
  }
};
