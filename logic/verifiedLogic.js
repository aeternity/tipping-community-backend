const ae = require('../utils/aeternity.js');

module.exports = class Verified {

  static async getAllClaimedEvents (req, res) {
    try {
      const tips = await ae.getTips();
      const allClaimedDomains = [
        ...(new Set(tips
          .filter(({ claim }) => !claim.unclaimed)
          .map(({ url }) => url)))];
      return res.send(allClaimedDomains);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err.message);
    }
  }
};
