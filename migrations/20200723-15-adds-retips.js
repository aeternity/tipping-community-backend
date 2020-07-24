'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Retips", deps: [Tips]
 * addColumn "type" to table "Tips"
 * changeColumn "type" on table "Notifications"
 *
 **/

var info = {
    "revision": 15,
    "name": "adds-retips",
    "created": "2020-07-23T14:17:09.974Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "Retips",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "tipId": {
                        "type": Sequelize.INTEGER,
                        "field": "tipId",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "Tips",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
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
var rollbackCommands = function(transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "Tips",
                "type",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "dropTable",
            params: ["Retips", {
                transaction: transaction
            }]
        },
        {
            fn: "changeColumn",
            params: [
                "Notifications",
                "type",
                {
                    "type": Sequelize.ENUM('COMMENT_ON_COMMENT', 'COMMENT_ON_TIP'),
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
