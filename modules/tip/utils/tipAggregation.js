const { sequelize } = require('../../../models');

/* eslint-disable max-len */

module.exports = {
  AGGREGATION_VIEW: [sequelize.literal('(SELECT ROW_TO_JSON("TipsAggregation".*) FROM TipsAggregation AS "TipsAggregation" WHERE "TipsAggregation"."id" = "Tip"."id")'), 'aggregation'],
  URL_STATS_VIEW: [sequelize.literal('(SELECT ROW_TO_JSON("UrlStats".*) FROM UrlStats AS "UrlStats" WHERE "UrlStats"."url" = "Tip"."url")'), 'urlStats'],
  TOTAL_AMOUNT_FOR_ORDER: [sequelize.literal('(COALESCE((SELECT "UrlStats"."totalAmount"::NUMERIC FROM UrlStats AS "UrlStats" WHERE "UrlStats"."url" = "Tip"."url"), 0))'), 'totalAmountForOrder'],
  COUNT_COMMENTS: [sequelize.literal('(SELECT COUNT("Comments"."id") FROM "Comments" WHERE "Comments"."tipId" = "Tip"."id")'), 'commentCount'],
  SCORE: [sequelize.literal('(SELECT dateScore * 1.5 + amountScore * 1 FROM (SELECT (GREATEST(0, 1 + LOG10(1 - EXTRACT(EPOCH FROM (NOW() - (GREATEST(NOW() - INTERVAL \'14 DAYS\', "Tip".timestamp)))) / EXTRACT(EPOCH FROM INTERVAL \'14 DAYS 1 SECOND\')))) AS dateScore, ((SELECT "totalAmount"::NUMERIC FROM TipsAggregation WHERE "id" = "Tip"."id") / (SELECT MAX("totalAmount"::NUMERIC) FROM TipsAggregation)) AS amountScore) AS score)'), 'score'],
  UNCLAIMED: [sequelize.literal('(unclaimed("Tip"."claimGen", "Tip"."url", "Tip"."contractId"))'), 'unclaimed'],
};
