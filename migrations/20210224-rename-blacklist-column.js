'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * add '_v1' postfix to
 *
 **/

var info = {
  "revision": 8,
  "name": "rename-blacklist-column",
  "created": "2021-02-24T11:50:10.521Z",
  "comment": ""
};

module.exports = {
  pos: 0,
  useTransaction: true,
  up: async function(queryInterface)
  {
    const transaction = await queryInterface.sequelize.transaction();
    // MODIFY TABLE
    await queryInterface.sequelize.query('ALTER TABLE "BlacklistEntries" RENAME COLUMN "flagger" TO "author" ;', { transaction: transaction });
    return transaction.commit();
  },
  down: async function(queryInterface)
  {
    const transaction = await queryInterface.sequelize.transaction();
    // MODIFY TABLE
    await queryInterface.sequelize.query('ALTER TABLE "BlacklistEntries" RENAME COLUMN "author" TO "flagger" ;', { transaction: transaction });
    return transaction.commit();
  },
  info: info
};
