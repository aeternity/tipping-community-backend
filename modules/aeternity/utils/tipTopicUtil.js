const BigNumber = require('bignumber.js');

const topicsRegex = /(#[a-zA-Z]+\b)(?!;)/g;

const getTipTopics = tips => { // TODO move to db
  const avgTipScoreWeight = 1.5;
  const countScoreWeight = 0.8;

  const topics = tips.reduce((acc, tip) => {
    if (tip.topics) {
      tip.topics.forEach(topic => {
        const score = tip.score ? tip.score : 0;

        // TODO optimize performance for token amount aggregation
        if (topic) {
          acc[topic] = acc[topic] ? {
            amount: new BigNumber(acc[topic].amount).plus(tip.Aggregation.totalamount).toFixed(),
            totalScore: acc[topic].totalScore + score,
            count: acc[topic].count + 1,
            token_amount: tip.Aggregation.totaltokenamount.reduce((tokenAcc, tokenTip) => ({
              ...tokenAcc,
              [tokenTip.token]: tokenAcc[tokenTip.token]
                ? new BigNumber(tokenAcc[tokenTip.token]).plus(tokenTip.amount).toFixed()
                : new BigNumber(tokenTip.amount).toFixed(),
            }), acc[topic].token_amount ? acc[topic].token_amount : {}),
          } : {
            amount: tip.Aggregation.totalamount,
            totalScore: score,
            count: 1,
            token_amount: tip.Aggregation.totaltokenamount.reduce((allTokenTipAmounts, tokenTip) => ({
              ...allTokenTipAmounts,
              [tokenTip.token]: tokenTip.amount,
            }), {}),
          };
        }
      });
    }

    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(topics).map(x => x.count));

  const sortedTopic = Object.entries(topics).map(([topic, data]) => {
    const topicData = data;
    topicData.avgScore = data.totalScore / data.count;
    topicData.countScore = data.count / maxCount;

    topicData.score = topicData.avgScore * avgTipScoreWeight
      + topicData.countScore * countScoreWeight;
    return [topic, topicData];
  }).sort((a, b) => new BigNumber(b[1].score).minus(a[1].score).toNumber());

  return sortedTopic.slice(0, 10).map(([topic, topicData]) => [topic, {
    ...topicData,
    tokenAmount: Object.entries(topicData.token_amount).map(([token, amount]) => ({ token, amount })),
  }]);
};

module.exports = {
  getTipTopics, topicsRegex,
};
