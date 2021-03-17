const { sequelize } = require('../../../models');
const { Op } = require('sequelize');

module.exports = {
  FILTER_BLACKLIST: {[Op.notIn]: sequelize.literal('(SELECT "BlacklistEntries"."tipId" FROM "BlacklistEntries" WHERE "BlacklistEntries"."tipId" = "Tip"."id")')},
  FILTER_SIMILARITY_SUM: (search) =>
    sequelize.fn(
      'sum_array',
      sequelize.fn('ARRAY_PREPEND',
        sequelize.fn('SIMILARITY', sequelize.col('Tip.title'), search),
        sequelize.fn('ARRAY_PREPEND',
          sequelize.fn('SIMILARITY', sequelize.col('Tip.sender'), search),
          sequelize.fn('ARRAY_PREPEND',
            sequelize.fn('SIMILARITY', sequelize.col('Tip.url'), search),
            sequelize.fn('ARRAY_PREPEND',
              sequelize.fn('SIMILARITY', sequelize.literal('(SELECT CONCAT("LinkPreviews"."description", "LinkPreviews"."title") FROM "LinkPreviews" WHERE "LinkPreviews"."requestUrl" = "Tip"."url")'), search),
              sequelize.literal('ARRAY[0::REAL]')
            ))))
    ),
};
