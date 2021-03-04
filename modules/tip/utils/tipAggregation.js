const { Tip } = require('../../../models');

module.exports = {
  AGGREGATION_VIEW: [Tip.sequelize.literal('(SELECT ROW_TO_JSON("TipsAggregation".*) FROM TipsAggregation AS "TipsAggregation" WHERE "TipsAggregation"."id" = "Tip"."id")'), 'Aggregation'],
  COUNT_COMMENTS: [Tip.sequelize.literal('(SELECT COUNT("Comments"."id") FROM "Comments" WHERE "Comments"."tipId" = "Tip"."id")'), 'commentCount'],
  SCORE: [Tip.sequelize.literal('(SELECT dateScore * 1.5 + amountScore * 1 FROM (SELECT (GREATEST(0, 1 + LOG10(1 - EXTRACT(EPOCH FROM (NOW() - (GREATEST(NOW() - INTERVAL \'14 DAYS\', "Tip".timestamp)))) / EXTRACT(EPOCH FROM INTERVAL \'14 DAYS 1 SECOND\')))) AS dateScore, ((SELECT "totalamount"::NUMERIC FROM TipsAggregation WHERE "id" = "Tip"."id") / (SELECT MAX("totalamount"::NUMERIC) FROM TipsAggregation)) AS amountScore) AS score)'), 'score'],
};
