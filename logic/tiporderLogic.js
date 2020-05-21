const BigNumber = require('bignumber.js');

const dateAgeScoreWeight = 1.5;
const tipAmountScoreWeight = 1;
const tipTitleScoreWeight = 0.7;
//const featuredScoreWeight = 10;

module.exports = class Tiporder {

  static applyTipScoring(tips) {
    const maxTipAmount = BigNumber.max(...tips.map(tip => tip.total_amount), '1');

    return tips.map(tip => {
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

      tip.score = dateAgeScore * dateAgeScoreWeight +
        tipAmountScore * tipAmountScoreWeight +
        tipTitleScore * tipTitleScoreWeight
      //+ featuredScore * featuredScoreWeight;

      return tip;
    });
  };
};
