import BigNumber from "bignumber.js";

const topicsRegex = /(#[a-zA-Z]+\b)(?!;)/g;
const getTipTopics = (tips) => {
  const avgTipScoreWeight = 1.5;
  const countScoreWeight = 1;
  const amountScoreWeight = 1;
  const topics = tips.reduce((acc, tip) => {
    if (tip.topics) {
      tip.topics.forEach((topic) => {
        const score = tip.score ? tip.score : 0;
        // TODO optimize performance for token amount aggregation
        if (topic) {
          acc[topic] = acc[topic]
            ? {
                amount: new BigNumber(acc[topic].amount).plus(tip.aggregation.totalAmount).toFixed(),
                totalScore: acc[topic].totalScore + score,
                count: acc[topic].count + 1,
                tokenAmount: tip.aggregation.totalTokenAmount.reduce(
                  (tokenAcc, tokenTip) => ({
                    ...tokenAcc,
                    [tokenTip.token]: tokenAcc[tokenTip.token] ? new BigNumber(tokenAcc[tokenTip.token]).plus(tokenTip.amount).toFixed() : new BigNumber(tokenTip.amount).toFixed(),
                  }),
                  acc[topic].tokenAmount ? acc[topic].tokenAmount : {},
                ),
              }
            : {
                amount: tip.aggregation.totalAmount,
                totalScore: score,
                count: 1,
                tokenAmount: tip.aggregation.totalTokenAmount.reduce(
                  (allTokenTipAmounts, tokenTip) => ({
                    ...allTokenTipAmounts,
                    [tokenTip.token]: tokenTip.amount,
                  }),
                  {},
                ),
              };
        }
      });
    }
    return acc;
  }, {});
  const maxCount = Math.max(...Object.values(topics).map((x) => x.count));
  const maxAmount = Math.max(...Object.values(topics).map((x) => new BigNumber(x.amount).toNumber()));
  const sortedTopic = Object.entries(topics)
    .map(([topic, data]) => {
      const topicData = data;
      topicData.avgScore = data.totalScore / data.count;
      topicData.countScore = data.count / maxCount;
      topicData.amountScore = data.amount / maxAmount;
      topicData.score = topicData.avgScore * avgTipScoreWeight + topicData.countScore * countScoreWeight + topicData.amountScore * amountScoreWeight;
      if (topicData.amountScore === 0) topicData.score = 0;
      return [topic, topicData];
    })
    .sort((a, b) => new BigNumber(b[1].score).minus(a[1].score).toNumber());
  return sortedTopic.slice(0, 10).map(([topic, topicData]) => [
    topic,
    {
      ...topicData,
      tokenAmount: Object.entries(topicData.tokenAmount).map(([token, amount]) => ({ token, amount })),
    },
  ]);
};
export { getTipTopics };
export { topicsRegex };
export default {
  getTipTopics,
  topicsRegex,
};
