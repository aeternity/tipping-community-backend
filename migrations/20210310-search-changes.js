import Sequelize from "sequelize";
("use strict");
/**
 * Actions summary:
 *
 **/
var info = {
  revision: 16,
  name: "search-changes",
  created: "2021-03-10T13:28:53.616Z",
  comment: "",
};
var migrationCommands = function (transaction) {
  return [];
};
var rollbackCommands = function (transaction) {
  return [];
};
export const pos = 0;
export const useTransaction = true;
export const execute = moduleExports.execute;
export const up = moduleExports.up;
export const down = moduleExports.down;
const moduleExports = {
  pos,
  useTransaction,
  execute: function (queryInterface, Sequelize, _commands) {
    var index = this.pos;
    function run(transaction) {
      const commands = _commands(transaction);
      return new Promise(function (resolve, reject) {
        function next() {
          if (index < commands.length) {
            let command = commands[index];
            console.log("[#" + index + "] execute: " + command.fn);
            index++;
            queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
          } else resolve();
        }
        next();
      });
    }
    if (this.useTransaction) {
      return queryInterface.sequelize.transaction(run);
    } else {
      return run(null);
    }
  },
  up: async function (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    await queryInterface.sequelize.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;", { transaction });
    await queryInterface.sequelize.query("CREATE OR REPLACE FUNCTION sum_array(REAL[]) RETURNS NUMERIC AS 'SELECT SUM(a)::NUMERIC AS sum FROM (SELECT UNNEST($1) AS a) AS b' LANGUAGE SQL IMMUTABLE;", { transaction });
    await queryInterface.sequelize.query('CREATE INDEX LinkPreviews_idx_gin ON "LinkPreviews" USING GIN (("LinkPreviews"."description" || "LinkPreviews"."title") GIN_TRGM_OPS);', { transaction });
    await transaction.commit();
    return this.execute(queryInterface, Sequelize, migrationCommands);
  },
  down: async function (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    await queryInterface.sequelize.query("DROP INDEX LinkPreviews_idx_gin;", { transaction });
    await queryInterface.sequelize.query("DROP FUNCTION sum_array(REAL[]);", { transaction });
    await queryInterface.sequelize.query("DROP EXTENSION pg_trgm;", { transaction });
    await transaction.commit();
    return this.execute(queryInterface, Sequelize, rollbackCommands);
  },
  info: info,
};
export { info };
export default moduleExports;
