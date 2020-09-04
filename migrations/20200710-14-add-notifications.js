'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Notifications", deps: []
 *
 **/

var info = {
    "revision": 14,
    "name": "add-notifications",
    "created": "2020-07-10T12:39:26.535Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
        fn: "createTable",
        params: [
            "Notifications",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "type": {
                    "type": Sequelize.ENUM('COMMENT_ON_COMMENT', 'COMMENT_ON_TIP'),
                    "field": "type",
                    "allowNull": false
                },
                "receiver": {
                    "type": Sequelize.STRING,
                    "field": "receiver",
                    "allowNull": false
                },
                "status": {
                    "type": Sequelize.ENUM('CREATED', 'READ'),
                    "field": "status",
                    "defaultValue": "CREATED",
                    "allowNull": false
                },
                "entityType": {
                    "type": Sequelize.ENUM('COMMENT', 'TIP'),
                    "field": "entityType",
                    "allowNull": true
                },
                "entityId": {
                    "type": Sequelize.STRING,
                    "field": "entityId",
                    "allowNull": true
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
                }
            },
            {
                "transaction": transaction
            }
        ]
    }];
};
var rollbackCommands = function(transaction) {
    return [{
        fn: "dropTable",
        params: ["Notifications", {
            transaction: transaction
        }]
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