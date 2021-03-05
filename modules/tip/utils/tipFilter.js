const { Tip } = require('../../../models');
const Sequelize = require('sequelize');

module.exports = {
  FILTER_BLACKLIST: {[Sequelize.Op.notIn]:Tip.sequelize.literal('(SELECT "BlacklistEntries"."tipId" FROM "BlacklistEntries" WHERE "BlacklistEntries"."tipId" = "Tip"."id")')},
};
