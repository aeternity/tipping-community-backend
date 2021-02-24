const { Tip } = require('../../../models');

const TIP_AGGREGATION = {
  TOTAL_URL_AMOUNT: [Tip.sequelize.literal('(SELECT SUM("Tips"."amount") FROM "Tips" WHERE "Tips"."url" = "Tips"."url")'), 'totalUrlAmount'],
};

module.exports = {
  TIP_AGGREGATION,
};
