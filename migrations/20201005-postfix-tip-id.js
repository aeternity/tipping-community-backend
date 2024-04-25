'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * add '_v1' postfix to
 *
 **/

var info = {
  "revision": 4,
  "name": "postfix-tip-id",
  "created": "2020-10-05T11:50:10.521Z",
  "comment": ""
};

module.exports = {
  pos: 0,
  useTransaction: true,
  up: async function(queryInterface)
  {
    // DROP NOTIFICATIONS SO ALL ENTRIES CONTAIN A SENDER
    const transaction = await queryInterface.sequelize.transaction();
    // MODIFY DATA
    await queryInterface.sequelize.query('UPDATE "BlacklistEntries" SET "tipId" = "tipId" || \'_v1\';', { transaction: transaction });
    await queryInterface.sequelize.query('UPDATE "Comments" SET "tipId" = "tipId" || \'_v1\';', { transaction: transaction });
    await queryInterface.sequelize.query('UPDATE "Tips" SET "id" = "id" || \'_v1\' ;', { transaction: transaction }); // Should cascade
    await queryInterface.sequelize.query('UPDATE "Retips" SET "id" = "id" || \'_v1\';', { transaction: transaction });
    await queryInterface.sequelize.query('UPDATE "Notifications" SET "entityId" = "entityId" || \'_v1\' WHERE "entityType" = \'TIP\';', { transaction: transaction });
    await queryInterface.sequelize.query('UPDATE "Notifications" SET "sourceId" = "sourceId" || \'_v1\' WHERE "sourceType" = \'TIP\' OR "sourceType" = \'RETIP\';', { transaction: transaction });
    return transaction.commit();
  },
  down: () => {},
  info: info
};
