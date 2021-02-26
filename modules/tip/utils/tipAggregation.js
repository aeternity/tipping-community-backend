const { Tip } = require('../../../models');

module.exports = {
  TOTAL_URL_AMOUNT: [Tip.sequelize.literal('(SELECT SUM("Tips"."amount") FROM "Tips" WHERE "Tips"."url" = "Tip"."url")'), 'totalUrlAmount'],
  COUNT_COMMENTS: [Tip.sequelize.literal('(SELECT COUNT("Comments"."id") FROM "Comments" WHERE "Comments"."tipId" = "Tip"."id")'), 'commentCount'],
  TOTAL_AMOUNT: [Tip.sequelize.literal('(SELECT SUM("Retips"."amount") + "Tip"."amount" FROM "Retips" WHERE "Retips"."tipId" = "Tip"."id")'), 'totalAmount'],
  TOKEN_TOTAL_AMOUNT: [Tip.sequelize.literal('ARRAY(SELECT JSON_BUILD_OBJECT(COALESCE("Retips"."token", "Tip"."token"), SUM("Retips"."tokenAmount") + "Tip"."tokenAmount") FROM "Retips" WHERE "Retips"."tipId" = "Tip"."id" AND COALESCE("Retips"."token", "Tip"."token") IS NOT NULL GROUP BY COALESCE("Retips"."token", "Tip"."token"))'), 'tokenTotalAmount'],
};
