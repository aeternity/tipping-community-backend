const ae = require('../utils/aeternity.js');
const Logger = require('../utils/logger');

module.exports = class Verified {
  static async getAllClaimedEvents(req, res) {
    try {
      const tips = await ae.getTips();
      const allClaimedDomains = [
        ...(new Set(tips
          .filter(({ claim }) => !claim.unclaimed)
          .map(({ url }) => url)))];
      return res.send(allClaimedDomains);
    } catch (err) {
      (new Logger('VerifiedLogic')).error(err);
      return res.status(500).send(err.message);
    }
  }
};
