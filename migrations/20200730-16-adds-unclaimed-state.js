'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "unclaimed" to table "Retips"
 * addColumn "unclaimed" to table "Tips"
 * changeColumn "type" on table "Notifications"
 *
 **/

var info = {
    "revision": 16,
    "name": "adds-unclaimed-state",
    "created": "2020-07-30T07:24:12.364Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
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
            fn: "changeColumn",
            params: [
                "Notifications",
                "type",
                {
                    "type": Sequelize.ENUM('COMMENT_ON_COMMENT', 'COMMENT_ON_TIP', 'TIP_ON_COMMENT', 'RETIP_ON_TIP', 'CLAIM_OF_TIP', 'CLAIM_OF_RETIP'),
                    "field": "type",
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
                "unclaimed",
                {
                    transaction: transaction
                }
            ]
        },
        {
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
            fn: "changeColumn",
            params: [
                "Notifications",
                "type",
                {
                    "type": Sequelize.ENUM('COMMENT_ON_COMMENT', 'COMMENT_ON_TIP', 'TIP_ON_COMMENT', 'RETIP_ON_TIP'),
                    "field": "type",
                    "allowNull": false
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
    up: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
