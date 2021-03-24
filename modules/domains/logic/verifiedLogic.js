const TipLogic = require('../../tip/logic/tipLogic');
const logger = require('../../../utils/logger')(module);

module.exports = class Verified {
  static async getAllClaimedEvents(req, res) {
    try {
      const tips = await TipLogic.fetchAllLocalTips(); // TODO make extra db fetch function
      const allClaimedDomains = [
        ...(new Set(tips
          .filter((tip) => tip.url && !tip.unclaimed)
          .map(({ url }) => url)))];
      return res.send(allClaimedDomains);
    } catch (err) {
      logger.error(err);
      return res.status(500).send(err.message);
    }
  }
};
