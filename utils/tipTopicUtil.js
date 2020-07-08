const BigNumber = require('bignumber.js');

const topicsRegex = /(#[a-zA-Z]+\b)(?!;)/g;

const getTipTopics = tips => {
  const avgTipScoreWeight = 1.5;
  const countScoreWeight = 0.8;

  const topics = tips.reduce((accData, tip) => {
    const acc = accData;
    if (tip.topics) {
      tip.topics.forEach(topic => {
        const score = tip.score ? tip.score : 0;

        // TODO optimize performance for token amount aggregation
        if (topic) {
          acc[topic] = acc[topic] ? {
            amount: new BigNumber(acc[topic].amount).plus(tip.total_amount).toFixed(),
            totalScore: acc[topic].totalScore + score,
            count: acc[topic].count + 1,
            token_amount: tip.token_total_amount.reduce((tokenAccData, tokenTip) => {
              const tokenAcc = tokenAccData;
              tokenAcc[tokenTip.token] = tokenAcc[tokenTip.token]
                ? new BigNumber(tokenAcc[tokenTip.token]).plus(tokenTip.amount).toFixed()
                : new BigNumber(tokenTip.amount).toFixed();
              return tokenAcc;
            }, acc[topic].token_amount ? acc[topic].token_amount : {}),
          } : {
            amount: tip.total_amount,
            totalScore: score,
            count: 1,
            token_amount: tip.token_total_amount.reduce((tokenAccData, tokenTip) => {
              const tokenAcc = tokenAccData;
              tokenAcc[tokenTip.token] = tokenTip.amount;
              return tokenAcc;
            }, {}),
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

  return sortedTopic.slice(0, 10).map(([topic, data]) => {
    const topicData = data;
    topicData.token_amount = Object.entries(topicData.token_amount).map(([token, amount]) => ({ token, amount }));
    return [topic, topicData];
  });
};

module.exports = {
  getTipTopics, topicsRegex,
};
