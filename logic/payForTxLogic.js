const Logger = require('../utils/logger.js');
const DomLoader = require('../utils/domLoader.js');
const ae = require('../utils/aeternity.js');

const logger = new Logger('payForTx');

module.exports = class PayForTxLogic {

  static async payForTx (req, res) {
    if (!req.body) return PayForTxLogic.sendError(req, res, 400, 'no request body found');
    if (!req.body.url) return PayForTxLogic.sendError(req, res, 400, 'url not found in body');
    if (!req.body.address) return PayForTxLogic.sendError(req, res, 400, 'address not found in body');
    if (!ae || !ae.client) return PayForTxLogic.sendError(req, res, 500, 'sdk not initialized yet');

    try {
      const { html } = await DomLoader.getHTMLfromURL(req.body.url);
      if (!html) return PayForTxLogic.sendError(req, res, 500, 'could not retrieve html for url');
      let address = html.match(/(ak\_[A-Za-z0-9]{49,50})/g) || [];
      const chainNames = html.match(/[A-Za-z0-9]+\.chain/g);
      if (chainNames) address = [...address, ...(await ae.getAddressFromChainName(chainNames))];
      if (address.length > 0) {
        if (!address.includes(req.body.address)) return PayForTxLogic.sendError(req, res, 401, 'found address does not match requested address');
        const result = await ae.claimTips(req.body.address, req.body.url);
        // TODO save tx hash to log
        return PayForTxLogic.sendSuccess(req, res);
      } else {
        return PayForTxLogic.sendError(req, res, 401, 'Could not find address in website');
      }
    } catch (e) {
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
