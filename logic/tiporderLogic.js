const BigNumber = require('bignumber.js');

const aeternity = require('../utils/aeternity.js');
const {BlacklistEntry} = require('../models');
const dateAgeScoreWeight = 1.5;
const tipAmountScoreWeight = 1;
const tipTitleScoreWeight = 0.7;
//const featuredScoreWeight = 10;

module.exports = class Tiporder {

  static async fetchTipOrder(fetchTips = null) {
    const blacklist = await BlacklistEntry.findAll({raw: true, where: {status: 'hidden'}});
    const blacklistedIds = blacklist.map(b => b.tipId);

    const state = fetchTips ? await fetchTips() : await aeternity.getTips();

    const maxTipAmount = BigNumber.max(...state.map(tip => tip.total_amount), '1');
    const tips = state.map(tip => {
      //remove some dates that are older than .9995%
      const datesToConsiderScore = Math.max(((tip.timestamp / new Date().getTime()) - 0.9995) * 1000, 0);
      //decay older dates more than newer ones
      const dateAgeScore = datesToConsiderScore === 0 ? 0 : Math.max(1 + Math.log10(datesToConsiderScore), 0);
      //score if title is set
      const tipTitleScore = tip.note ? 1 : 0;
      //order tutorial highest
      //const featuredScore = tip.url === "https://medium.com/@coronanewsorg/corona-wallet-beginners-guide-a46e2f845832" ? 1 : 0;
      //score tip amount by percentage of highest amount, no decay
      const tipAmountScore = new BigNumber(tip.amount_ae).dividedBy(maxTipAmount).toNumber();

      tip.dateAgeScore = dateAgeScore;
      tip.tipAmountScore = tipAmountScore;
      tip.tipTitleScore = tipTitleScore;
      //tip.featuredScore = featuredScore;
      tip.score = tip.dateAgeScore * dateAgeScoreWeight +
        tip.tipAmountScore * tipAmountScoreWeight +
        tip.tipTitleScore * tipTitleScoreWeight
        //tip.featuredScore * featuredScoreWeight;

      return tip;
    });

    return tips
      .filter(tip => !blacklistedIds.includes(tip.id))
      .map(tip => {
        return {
          id: tip.id,
          score: tip.score
        }
      });
  }
};
