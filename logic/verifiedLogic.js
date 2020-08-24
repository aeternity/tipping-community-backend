const CacheLogic = require('./cacheLogic.js');
const Logger = require('../utils/logger');

module.exports = class Verified {
  static async getAllClaimedEvents(req, res) {
    try {
      const tips = await CacheLogic.getTips();
      const allClaimedDomains = [
        ...(new Set(tips
          .filter(({ claim }) => !claim.unclaimed)
          .map(({ url }) => url)))];
      return res.send(allClaimedDomains);
    } catch (err) {
      Logger.error(err);
      return res.status(500).send(err.message);
    }
  }
};
