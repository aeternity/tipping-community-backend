const BigNumber = require('bignumber.js');

const getTipTopics = (tips) => {
  const avgTipScoreWeight = 1.5;
  const countScoreWeight = 0.8;

  const topics = tips.reduce((acc, tip) => {
    if (tip.topics) {
      tip.topics.forEach((topic) => {
        const score = tip.score ? tip.score : 0;

        if (topic) {
          acc[topic] = acc[topic] ? {
            amount: new BigNumber(acc[topic].amount).plus(tip.total_amount).toFixed(),
            totalScore: acc[topic].totalScore + score,
            count: acc[topic].count + 1,
          } : {
            amount: tip.total_amount,
            totalScore: score,
            count: 1,
          };
        }
      });
    }

    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(topics).map((x) => x.count));

  const sortedTopic = Object.entries(topics).map(([topic, data]) => {
    const topicData = data;
    topicData.avgScore = data.totalScore / data.count;
    topicData.countScore = data.count / maxCount;

    topicData.score = topicData.avgScore * avgTipScoreWeight
      + topicData.countScore * countScoreWeight;
    return [topic, topicData];
  }).sort((a, b) => new BigNumber(b[1].score).minus(a[1].score).toNumber());

  return sortedTopic.slice(0, 10);
};

module.exports = {
  getTipTopics
};
