import models from '../../../models/index.js';

const { sequelize } = models;
export const AGGREGATION_VIEW = [sequelize.literal('(SELECT ROW_TO_JSON("TipsAggregation".*) FROM TipsAggregation AS "TipsAggregation" WHERE "TipsAggregation"."id" = "Tip"."id")'), 'aggregation'];
export const URL_STATS_VIEW = [sequelize.literal('(SELECT ROW_TO_JSON("UrlStats".*) FROM UrlStats AS "UrlStats" WHERE "UrlStats"."url" = "Tip"."url")'), 'urlStats'];
export const TOTAL_AMOUNT_FOR_ORDER = [sequelize.literal('(COALESCE((SELECT "UrlStats"."totalAmount"::NUMERIC FROM UrlStats AS "UrlStats" WHERE "UrlStats"."url" = "Tip"."url"), 0))'), 'totalAmountForOrder'];
export const COUNT_COMMENTS = [sequelize.literal('(SELECT COUNT("Comments"."id") FROM "Comments" WHERE "Comments"."tipId" = "Tip"."id")'), 'commentCount'];
export const SCORE = [sequelize.literal('(SELECT dateScore * 1.5 + amountScore * 1 FROM (SELECT (GREATEST(0, 1 + LOG10(1 - EXTRACT(EPOCH FROM (NOW() - (GREATEST(NOW() - INTERVAL \'14 DAYS\', "Tip".timestamp)))) / EXTRACT(EPOCH FROM INTERVAL \'14 DAYS 1 SECOND\')))) AS dateScore, ((SELECT "totalAmount"::NUMERIC FROM TipsAggregation WHERE "id" = "Tip"."id") / (SELECT MAX("totalAmount"::NUMERIC) FROM TipsAggregation)) AS amountScore) AS score)'), 'score'];
export const UNCLAIMED = [sequelize.literal('(unclaimed("Tip"."claimGen", "Tip"."url", "Tip"."contractId"))'), 'unclaimed'];
export default {
  AGGREGATION_VIEW,
  URL_STATS_VIEW,
  TOTAL_AMOUNT_FOR_ORDER,
  COUNT_COMMENTS,
  SCORE,
  UNCLAIMED,
};
