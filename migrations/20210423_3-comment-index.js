import Sequelize from "sequelize";
("use strict");
/**
 * Actions summary:
 *
 * changeColumn "tipId" on table "Comments"
 * changeColumn "tipId" on table "Comments"
 * changeColumn "claimGen" on table "Tips"
 * changeColumn "amount" on table "Tips"
 * changeColumn "tokenAmount" on table "Tips"
 *
 **/
var info = {
  revision: 25,
  name: "comment-index",
  created: "2021-02-24T14:48:44.271Z",
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
    await queryInterface.sequelize.query('CREATE INDEX comment_tip_id_idx ON "Comments" ("tipId");', { transaction });
    await transaction.commit();
    return this.execute(queryInterface, Sequelize, migrationCommands);
  },
  down: async function (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    await queryInterface.sequelize.query("DROP INDEX comment_tip_id_idx;", { transaction });
    await transaction.commit();
    return this.execute(queryInterface, Sequelize, rollbackCommands);
  },
  info: info,
};
export { info };
export default moduleExports;
