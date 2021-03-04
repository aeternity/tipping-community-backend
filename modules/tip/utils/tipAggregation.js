const { Tip } = require('../../../models');

module.exports = {
  TOTAL_URL_AMOUNT: [Tip.sequelize.literal('(SELECT SUM("Tips"."amount") FROM "Tips" WHERE "Tips"."url" = "Tip"."url")'), 'totalUrlAmount'],
  COUNT_COMMENTS: [Tip.sequelize.literal('(SELECT COUNT("Comments"."id") FROM "Comments" WHERE "Comments"."tipId" = "Tip"."id")'), 'commentCount'],
  TOTAL_AMOUNT: [Tip.sequelize.literal('(SELECT total_amount("Tip"."id"))'), 'totalAmount'],
  TOTAL_UNCLAIMED_AMOUNT: [Tip.sequelize.literal('(SELECT total_unclaimed_amount("Tip"."id"))'), 'totalUnclaimedAmount'],
  TOKEN_TOTAL_AMOUNT: [Tip.sequelize.literal('ARRAY(SELECT JSON_BUILD_OBJECT(COALESCE("Retips"."token", "Tip"."token"), SUM("Retips"."tokenAmount") + "Tip"."tokenAmount") FROM "Retips" WHERE "Retips"."tipId" = "Tip"."id" AND COALESCE("Retips"."token", "Tip"."token") IS NOT NULL GROUP BY COALESCE("Retips"."token", "Tip"."token"))'), 'tokenTotalAmount'],
  TOKEN_TOTAL_UNCLAIMED_AMOUNT: [Tip.sequelize.literal('ARRAY(SELECT JSON_BUILD_OBJECT(COALESCE("Retips"."token", "Tip"."token"), SUM(CASE WHEN unclaimed("Retips"."claimGen", "Tip"."url", "Tip"."contractId") THEN "Retips"."tokenAmount" ELSE 0 END) + (CASE WHEN unclaimed("Tip"."claimGen", "Tip"."url", "Tip"."contractId") THEN "Tip"."tokenAmount" ELSE 0 END)) FROM "Retips" WHERE "Retips"."tipId" = "Tip"."id" AND COALESCE("Retips"."token", "Tip"."token") IS NOT NULL GROUP BY COALESCE("Retips"."token", "Tip"."token"))'), 'tokenTotalUnclaimedAmount'],
  SCORE: [Tip.sequelize.literal('(SELECT dateScore * 1.5 + amountScore * 1 FROM (SELECT (GREATEST(0, 1 + LOG10(1 - EXTRACT(EPOCH FROM (NOW() - (GREATEST(NOW() - INTERVAL \'14 DAYS\', "Tip".timestamp)))) / EXTRACT(EPOCH FROM INTERVAL \'14 DAYS 1 SECOND\')))) AS dateScore, ("Tip"."amount" / (SELECT MAX("Tips"."amount") FROM "Tips")) AS amountScore) AS score)'), 'score'],
};
