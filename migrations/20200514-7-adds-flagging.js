'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "id" from table "BlacklistEntries"
 * addColumn "flagger" to table "BlacklistEntries"
 * addColumn "status" to table "BlacklistEntries"
 * changeColumn "tipId" on table "BlacklistEntries"
 *
 **/

var info = {
    "revision": 7,
    "name": "adds-flagging",
    "created": "2020-05-14T09:28:20.850Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "BlacklistEntries",
                "id",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "BlacklistEntries",
                "flagger",
                {
                    "type": Sequelize.STRING,
                    "field": "flagger",
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
                "BlacklistEntries",
                "status",
                {
                    "type": Sequelize.ENUM('flagged', 'hidden'),
                    "field": "status",
                    "allowNull": false,
                    "defaultValue": "hidden"
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "changeColumn",
            params: [
                "BlacklistEntries",
                "tipId",
                {
                    "type": Sequelize.INTEGER,
                    "field": "tipId",
                    "primaryKey": true,
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
                "BlacklistEntries",
                "flagger",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "BlacklistEntries",
                "status",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "BlacklistEntries",
                "id",
                {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "changeColumn",
            params: [
                "BlacklistEntries",
                "tipId",
                {
                    "type": Sequelize.INTEGER,
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
