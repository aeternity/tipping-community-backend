const ae = require('../utils/aeternity.js');

module.exports = class Verified {

  static async getAllClaimedEvents (req, res) {
    try {
      await ae.init();
      const state = await ae.callContract();
      const allClaimedDomains = state
        .filter(([_, data]) => data.repaid)
        .map(([[domain, nonce], _]) => (new URL(domain)).hostname)
        .reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []);
      return res.send(allClaimedDomains);
    } catch (err) {
      console.error(err);
      return res.status(500).send(err.message);
    }
  }
};
