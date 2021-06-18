'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * alter functions to add public search path
 *
 **/

var info = {
    "revision": 26,
    "name": "fix-function-search-path",
    "created": "2021-06-18T11:11:39.431Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [];
};
var rollbackCommands = function(transaction) {
    return [];
};

module.exports = {
    pos: 0,
    useTransaction: true,
    execute: function(queryInterface, Sequelize, _commands)
    {
        var index = this.pos;
        function run(transaction) {
            const commands = _commands(transaction);
            return new Promise(function(resolve, reject) {
                function next() {
                    if (index < commands.length)
                    {
                        let command = commands[index];
                        console.log("[#"+index+"] execute: " + command.fn);
                        index++;
                        queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                    }
                    else
                        resolve();
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
    up: async function(queryInterface, Sequelize)
    {
      await this.execute(queryInterface, Sequelize, migrationCommands);

      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('ALTER FUNCTION unclaimed(numeric, text, varchar) SET search_path=public;', { transaction });
      await queryInterface.sequelize.query('ALTER FUNCTION unclaimed_amount(numeric, text, varchar, numeric) SET search_path=public;', { transaction });
      await queryInterface.sequelize.query('ALTER FUNCTION claimed_amount(numeric, text, varchar, numeric) SET search_path=public;', { transaction });
      return transaction.commit();
    },
    down: async function(queryInterface, Sequelize)
    {
      return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
