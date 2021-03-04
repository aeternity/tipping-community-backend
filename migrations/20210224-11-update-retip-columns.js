'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "unclaimed" from table "Retips"
 * addColumn "claimGen" to table "Retips"
 * addColumn "amount" to table "Retips"
 * addColumn "tokenAmount" to table "Retips"
 * addColumn "token" to table "Retips"
 * changeColumn "tipId" on table "Retips"
 * changeColumn "claimGen" on table "Tips"
 * changeColumn "amount" on table "Tips"
 * changeColumn "tokenAmount" on table "Tips"
 *
 **/

var info = {
    "revision": 10,
    "name": "noname",
    "created": "2021-02-24T17:49:30.713Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "Retips",
                "unclaimed",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Retips",
                "claimGen",
                {
                    "type": Sequelize.DECIMAL,
                    "field": "claimGen",
                    "allowNull": true
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Retips",
                "amount",
                {
                    "type": Sequelize.DECIMAL,
                    "field": "amount",
                    "allowNull": true
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Retips",
                "tokenAmount",
                {
                    "type": Sequelize.DECIMAL,
                    "field": "tokenAmount",
                    "allowNull": true
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Retips",
                "token",
                {
                    "type": Sequelize.STRING,
                    "field": "token",
                    "allowNull": true
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "changeColumn",
            params: [
                "Retips",
                "tipId",
                {
                    "type": Sequelize.STRING,
                    "onUpdate": "CASCADE",
                    "onDelete": "NO ACTION",
                    "references": {
                        "model": "Tips",
                        "key": "id"
                    },
                    "field": "tipId",
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
                "Retips",
                "claimGen",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Retips",
                "amount",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Retips",
                "tokenAmount",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Retips",
                "token",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Retips",
                "unclaimed",
                {
                    "type": Sequelize.BOOLEAN,
                    "field": "unclaimed",
                    "defaultValue": true
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "changeColumn",
            params: [
                "Retips",
                "tipId",
                {
                    "type": Sequelize.STRING,
                    "field": "tipId",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Tips",
                        "key": "id"
                    },
                    "allowNull": true
                },
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
      await queryInterface.sequelize.query('TRUNCATE TABLE "Retips" CASCADE;'); // hangs within transaction, so no transaction
      return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: async function(queryInterface, Sequelize)
    {
      await queryInterface.sequelize.query('TRUNCATE TABLE "Retips" CASCADE;'); // hangs within transaction, so no transaction
      return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};