'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Commentsancestors", deps: [Comments, Comments]
 * addColumn "parentId" to table "Comments"
 * addColumn "hierarchyLevel" to table "Comments"
 *
 **/

var info = {
    "revision": 4,
    "name": "recursive-comments",
    "created": "2020-04-29T16:38:50.456Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "Commentsancestors",
                {
                    "CommentId": {
                        "type": Sequelize.INTEGER,
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "Comments",
                            "key": "id"
                        },
                        "unique": "Commentsancestors_CommentId_ancestorId_unique",
                        "field": "CommentId",
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "ancestorId": {
                        "type": Sequelize.INTEGER,
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "Comments",
                            "key": "id"
                        },
                        "unique": "Commentsancestors_CommentId_ancestorId_unique",
                        "field": "ancestorId",
                        "primaryKey": true,
                        "allowNull": false
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
                "Comments",
                "parentId",
                {
                    "type": Sequelize.INTEGER,
                    "onUpdate": "CASCADE",
                    "onDelete": "RESTRICT",
                    "references": {
                        "model": "Comments",
                        "key": "id"
                    },
                    "allowNull": true,
                    "field": "parentId",
                    "hierarchy": true
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Comments",
                "hierarchyLevel",
                {
                    "type": Sequelize.INTEGER,
                    "field": "hierarchyLevel"
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
                "Comments",
                "parentId",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Comments",
                "hierarchyLevel",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "dropTable",
            params: ["Commentsancestors", {
                transaction: transaction
            }]
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
