'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "timestamp" to table "Tips"
 *
 **/

var info = {
    "revision": 17,
    "name": "add-timestamp-to-tip",
    "created": "2021-03-03T17:07:58.945Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
        fn: "addColumn",
        params: [
            "Tips",
            "timestamp",
            {
                "type": Sequelize.DATE,
                "field": "timestamp",
                "allowNull": false
            },
            {
                transaction: transaction
            }
        ]
    }];
};
var rollbackCommands = function(transaction) {
    return [{
        fn: "removeColumn",
        params: [
            "Tips",
            "timestamp",
            {
                transaction: transaction
            }
        ]
    }];
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
      await queryInterface.sequelize.query('TRUNCATE TABLE "Tips" CASCADE;', { transaction });
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
