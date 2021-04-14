'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * changeColumn "browser" on table "ErrorReports"
 * changeColumn "error" on table "ErrorReports"
 * changeColumn "time" on table "ErrorReports"
 *
 **/

var info = {
    "revision": 10,
    "name": "update-errorreport-field-types",
    "created": "2021-04-14T09:14:58.469Z",
    "comment": ""
};

module.exports = {
  pos: 0,
  useTransaction: true,
  up: async function(queryInterface)
  {
    const transaction = await queryInterface.sequelize.transaction();
    // MODIFY TABLE
    await queryInterface.sequelize.query('ALTER TABLE "ErrorReports" ALTER COLUMN "browser" TYPE JSONB USING browser::JSONB ;', { transaction: transaction });
    await queryInterface.sequelize.query('ALTER TABLE "ErrorReports" ALTER COLUMN "error" TYPE JSONB USING error::JSONB ;', { transaction: transaction });
    await queryInterface.sequelize.query('ALTER TABLE "ErrorReports" ALTER COLUMN "time" TYPE BIGINT USING "time"::BIGINT ;', { transaction: transaction });
    return transaction.commit();
  },
  down: async function(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    // MODIFY TABLE
    await queryInterface.sequelize.query('ALTER TABLE "ErrorReports" ALTER COLUMN "browser" TYPE TEXT;', { transaction: transaction });
    await queryInterface.sequelize.query('ALTER TABLE "ErrorReports" ALTER COLUMN "error" TYPE TEXT', { transaction: transaction });
    await queryInterface.sequelize.query('ALTER TABLE "ErrorReports" ALTER COLUMN "time" TYPE STRING', { transaction: transaction });
    return transaction.commit();
  },
  info: info
};
