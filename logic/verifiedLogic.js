const ae = require('../utils/aeternity.js');

module.exports = class Verified {

  static async getAllClaimedEvents (req, res) {
    try {
      await ae.init();
      const tips = await ae.getTips();
      console.log(tips)
      const allClaimedDomains = tips
        .filter(({claim}) => !claim.unclaimed)
        .map(({url}) => (new URL(url)).hostname)
        .reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []);
      return res.send(allClaimedDomains);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err.message);
    }
  }
};
