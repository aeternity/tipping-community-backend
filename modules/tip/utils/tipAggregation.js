const { Tip } = require('../../../models');

const TIP_AGGREGATION = {
  TOTAL_URL_AMOUNT: [Tip.sequelize.literal('(SELECT SUM("Tips"."amount") FROM "Tips" WHERE "Tips"."url" = "Tip"."url")'), 'totalUrlAmount'],
  COUNT_COMMENTS: [Tip.sequelize.literal('(SELECT COUNT("Comments"."id") FROM "Comments" WHERE "Comments"."tipId" = "Tip"."id")'), 'commentCount'],
};

module.exports = {
  TIP_AGGREGATION,
};
