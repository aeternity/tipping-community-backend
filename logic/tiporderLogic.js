const ae = require('../utils/aeternity.js');
const {BlacklistEntry} = require('../utils/database.js');

module.exports = class Blacklist {

  static async getScoredBlacklistedOrder(req, res) {
    const blacklist = await BlacklistEntry.findAll({raw: true});
    const blacklistedIds = blacklist.map(b => b.tipId);

    const state = await ae.callContract();
    const contactIds = state.map(([tip, data]) => {
      data.tipId = tip[0] + "," + tip[1];
      return data;
    });

    const blacklistFiltered = contactIds.filter(data => !blacklistedIds.includes(data.tipId));

    return res.send(blacklistFiltered);
  }

};
