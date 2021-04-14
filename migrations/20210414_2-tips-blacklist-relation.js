'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * changeColumn "tipId" on table "BlacklistEntries"
 * changeColumn "tipId" on table "BlacklistEntries"
 *
 **/

var info = {
    "revision": 19,
    "name": "tips-blacklist-relation",
    "created": "2021-03-05T09:28:53.616Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "changeColumn",
            params: [
                "BlacklistEntries",
                "tipId",
                {
                    "type": Sequelize.STRING,
                    "onUpdate": "NO ACTION",
                    "onDelete": "NO ACTION",
                    "references": {
                        "model": "Tips",
                        "key": "id"
                    },
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
            fn: "changeColumn",
            params: [
                "BlacklistEntries",
                "tipId",
                {
                    "type": Sequelize.STRING,
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
