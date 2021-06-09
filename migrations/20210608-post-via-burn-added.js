'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * changeColumn "tipId" on table "Comments"
 * changeColumn "name" on table "Events"
 * changeColumn "type" on table "Tips"
 * changeColumn "media" on table "Tips"
 * changeColumn "topics" on table "Tips"
 * changeColumn "title" on table "Tips"
 *
 **/

var info = {
    "revision": 26,
    "name": "post-via-burn-added",
    "created": "2021-06-08T13:26:44.602Z",
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
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('ALTER TYPE "enum_Tips_type" ADD VALUE \'POST_VIA_BURN\';', { transaction });
      await queryInterface.sequelize.query('ALTER TYPE "enum_Events_name" ADD VALUE \'PostViaBurnReceived\';', { transaction });
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: async function(queryInterface, Sequelize)
    {
      return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
