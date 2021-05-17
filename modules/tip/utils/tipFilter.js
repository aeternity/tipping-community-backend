const { Op } = require('sequelize');
const { sequelize } = require('../../../models');

/* eslint-disable max-len */

module.exports = {
  FILTER_BLACKLIST: { [Op.notIn]: sequelize.literal('(SELECT "BlacklistEntries"."tipId" FROM "BlacklistEntries" WHERE "BlacklistEntries"."tipId" = "Tip"."id")') },
  FILTER_TOKEN: token => ({ [Op.in]: sequelize.literal(sequelize.getQueryInterface().format('(SELECT id FROM TipsAggregation WHERE \'{ "token": "%s"}\'::jsonb <@ ANY ("totalTokenAmount"::jsonb[]))', sequelize.escape(token))) }),
  FILTER_SIMILARITY_SUM: search => sequelize.fn(
    'sum_array',
    sequelize.fn('ARRAY_PREPEND',
      sequelize.fn('SIMILARITY', sequelize.col('Tip.title'), search),
      sequelize.fn('ARRAY_PREPEND',
        sequelize.fn('SIMILARITY', sequelize.col('Tip.sender'), search),
        sequelize.fn('ARRAY_PREPEND',
          sequelize.fn('SIMILARITY', sequelize.col('Tip.url'), search),
          sequelize.fn('ARRAY_PREPEND',
            sequelize.fn('SIMILARITY', sequelize.literal('(SELECT ("LinkPreviews"."description" || "LinkPreviews"."title") FROM "LinkPreviews" WHERE "LinkPreviews"."requestUrl" = "Tip"."url")'), search),
            sequelize.literal('ARRAY[0::REAL]'))))),
  ),
};
