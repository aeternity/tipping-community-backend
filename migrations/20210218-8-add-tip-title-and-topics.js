'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "topics" to table "Tips"
 * addColumn "title" to table "Tips"
 *
 **/

var info = {
    "revision": 7,
    "name": "add tip title and topics",
    "created": "2021-02-18T09:53:01.301Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "addColumn",
            params: [
                "Tips",
                "topics",
                {
                    "type": Sequelize.ARRAY(Sequelize.STRING),
                    "field": "topics",
                    "allowNull": false
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Tips",
                "title",
                {
                    "type": Sequelize.STRING,
                    "field": "title",
                    "allowNull": false
                },
                {
                    transaction: transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "Tips",
                "topics",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Tips",
                "title",
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
