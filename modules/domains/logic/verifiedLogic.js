const CacheLogic = require('../../cache/logic/cacheLogic');
const logger = require('../../../utils/logger')(module);

module.exports = class Verified {
  static async getAllClaimedEvents(req, res) {
    try {
      const allClaimedDomains = await CacheLogic.getOracleAllClaimedUrls();
      return res.send(allClaimedDomains);
    } catch (err) {
      logger.error(err);
      return res.status(500).send(err.message);
    }
  }
};
