'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "sender" to table "Retips"
 * addColumn "sender" to table "Tips"
 *
 **/

var info = {
    "revision": 17,
    "name": "add-sender",
    "created": "2020-08-24T09:29:05.462Z",
    "comment": ""
};

var rollbackCommands = function(transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "Retips",
                "sender",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Tips",
                "sender",
                {
                    transaction: transaction
                }
            ]
        }
    ];
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
      await queryInterface.sequelize.query('DROP TABLE Retips;', { transaction });
      await queryInterface.sequelize.query('DROP TABLE Tips;', { transaction });
      await queryInterface.sequelize.query("CREATE TABLE `Tips` (`id` INTEGER PRIMARY KEY, `language` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, `type` TEXT NOT NULL DEFAULT 'AE_TIP', `unclaimed` TINYINT(1) DEFAULT 1, `sender` TEXT NOT NULL)", { transaction });
      await queryInterface.sequelize.query("CREATE TABLE `Retips` (`id` INTEGER PRIMARY KEY, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, `tipId` INTEGER REFERENCES `Tips` (`id`) ON DELETE SET NULL ON UPDATE CASCADE, `unclaimed` TINYINT(1) DEFAULT 1, `sender` TEXT NOT NULL)", { transaction });
      await transaction.commit();

    },
    down: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
