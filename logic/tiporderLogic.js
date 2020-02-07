const BigNumber = require('bignumber.js');

const ae = require('../utils/aeternity.js');
const {BlacklistEntry} = require('../utils/database.js');
const dateAgeScoreWeight = 1.5;
const tipAmountScoreWeight = 1;

module.exports = class Tiporder {

  static async getScoredBlacklistedOrder(req, res) {

    const blacklist = await BlacklistEntry.findAll({raw: true});
    const blacklistedIds = blacklist.map(b => b.tipId);

    const state = await ae.callContract();

    const maxTipAmount = BigNumber.max(...state.map(([_, data]) => data.amount), '1');
    const tips = state.map(([tip, data]) => {
      // compute tip id
      data.tipId = tip[0] + "," + tip[1];

      // scoring

      //remove some dates that are older than .9995%
      const datesToConsiderScore = Math.max(((data.received_at / new Date().getTime()) - 0.9995) * 1000, 0);
      //decay older dates more than newer ones
      const dateAgeScore = datesToConsiderScore === 0 ? 0 : Math.max(1 + Math.log10(datesToConsiderScore), 0);

      //score tip amount by percentage of highest amount, no decay
      const tipAmountScore = new BigNumber(data.amount).dividedBy(maxTipAmount).toNumber();

      data.dateAgeScore = dateAgeScore;
      data.tipAmountScore = tipAmountScore;
      data.score = data.dateAgeScore * dateAgeScoreWeight + data.tipAmountScore * tipAmountScoreWeight;
      return data;
    });

    const blacklistFiltered = tips
      .filter(data => !blacklistedIds.includes(data.tipId))
      .map(tip => {
        return {
          id: tip.tipId,
          score: tip.score
        }
      });

    return res.send(blacklistFiltered);
  }
};
