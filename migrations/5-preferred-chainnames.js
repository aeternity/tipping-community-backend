'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "id" from table "Profiles"
 * addColumn "preferredChainName" to table "Profiles"
 * changeColumn "author" on table "Comments"
 * changeColumn "author" on table "Comments"
 * changeColumn "author" on table "Profiles"
 *
 **/

var info = {
    "revision": 5,
    "name": "preferred-chainnames",
    "created": "2020-04-30T16:20:56.628Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "Profiles",
                "id",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Profiles",
                "preferredChainName",
                {
                    "type": Sequelize.STRING,
                    "field": "preferredChainName",
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
                    "Profiles",
                    "author",
                    {
                        "type": Sequelize.STRING,
                        "field": "author",
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
                "Comments",
                "author",
                {
                    "type": Sequelize.STRING,
                    "onUpdate": "CASCADE",
                    "onDelete": "NO ACTION",
                    "references": {
                        "model": "Profiles",
                        "key": "author"
                    },
                    "field": "author",
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
                "Profiles",
                "preferredChainName",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Profiles",
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
                "Comments",
                "author",
                {
                    "type": Sequelize.STRING,
                    "field": "author",
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
