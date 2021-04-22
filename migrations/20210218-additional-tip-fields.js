'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "unclaimed" from table "Tips"
 * addColumn "contractId" to table "Tips"
 * addColumn "url" to table "Tips"
 * addColumn "token" to table "Tips"
 * addColumn "tokenAmount" to table "Tips"
 * addColumn "amount" to table "Tips"
 * addColumn "claimGen" to table "Tips"
 * changeColumn "type" on table "Tips"
 *
 **/

var info = {
    "revision": 12,
    "name": "additional-tip-fields",
    "created": "2021-02-18T16:07:17.918Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "Tips",
                "unclaimed",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Tips",
                "contractId",
                {
                    "type": Sequelize.STRING,
                    "field": "contractId",
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
                "url",
                {
                    "type": Sequelize.TEXT,
                    "field": "url",
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
                "Tips",
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
            fn: "addColumn",
            params: [
                "Tips",
                "tokenAmount",
                {
                    "type": Sequelize.NUMERIC,
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
                "Tips",
                "amount",
                {
                    "type": Sequelize.NUMERIC,
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
                "Tips",
                "claimGen",
                {
                    "type": Sequelize.NUMERIC,
                    "field": "claimGen",
                    "allowNull": true
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
                "contractId",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Tips",
                "url",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Tips",
                "token",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Tips",
                "tokenAmount",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Tips",
                "amount",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Tips",
                "claimGen",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Tips",
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
            fn: "addColumn",
            params: [
                "Tips",
                "type",
                {
                    "type": Sequelize.ENUM('AE_TIP', 'TOKEN_TIP', 'DIRECT_AE_TIP', 'DIRECT_TOKEN_TIP'),
                    "field": "type",
                    "allowNull": false,
                    "defaultValue": "AE_TIP"
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
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('ALTER TYPE "enum_Tips_type" ADD VALUE \'POST_WITHOUT_TIP\';');
      await queryInterface.sequelize.query('TRUNCATE TABLE "Tips" CASCADE;', { transaction });
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: async function(queryInterface, Sequelize)
    {
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('DROP TYPE "enum_Tips_type" CASCADE;');
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
