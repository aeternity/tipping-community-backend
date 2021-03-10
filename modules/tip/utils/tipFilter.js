const { Tip } = require('../../../models');
const { Op } = require('sequelize');

module.exports = {
  FILTER_BLACKLIST: {[Op.notIn]: Tip.sequelize.literal('(SELECT "BlacklistEntries"."tipId" FROM "BlacklistEntries" WHERE "BlacklistEntries"."tipId" = "Tip"."id")')},
  FILTER_SIMILARITY_SUM: (search) =>
    Tip.sequelize.fn(
      'sum_array',
      Tip.sequelize.fn('ARRAY_PREPEND',
        Tip.sequelize.fn('SIMILARITY', Tip.sequelize.col('Tip.title'), search),
        Tip.sequelize.fn('ARRAY_PREPEND',
          Tip.sequelize.fn('SIMILARITY', Tip.sequelize.col('Tip.sender'), search),
          Tip.sequelize.fn('ARRAY_PREPEND',
            Tip.sequelize.fn('SIMILARITY', Tip.sequelize.col('Tip.url'), search),
            Tip.sequelize.literal('ARRAY[0::REAL]')
          )))
    ),
};
