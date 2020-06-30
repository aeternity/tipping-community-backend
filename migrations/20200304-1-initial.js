'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "BlacklistEntries", deps: []
 * createTable "Comments", deps: []
 * createTable "LinkPreviews", deps: []
 * createTable "Profiles", deps: []
 * createTable "Tips", deps: []
 *
 **/

var info = {
    "revision": 1,
    "name": "initial",
    "created": "2020-03-03T15:08:30.596Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "BlacklistEntries",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "tipId": {
                        "type": Sequelize.INTEGER,
                        "field": "tipId",
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
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "Comments",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "tipId": {
                        "type": Sequelize.INTEGER,
                        "field": "tipId",
                        "allowNull": false
                    },
                    "text": {
                        "type": Sequelize.STRING,
                        "field": "text",
                        "allowNull": false
                    },
                    "author": {
                        "type": Sequelize.STRING,
                        "field": "author",
                        "allowNull": false
                    },
                    "hidden": {
                        "type": Sequelize.BOOLEAN,
                        "field": "hidden",
                        "defaultValue": false
                    },
                    "signature": {
                        "type": Sequelize.STRING,
                        "field": "signature",
                        "allowNull": false
                    },
                    "challenge": {
                        "type": Sequelize.STRING,
                        "field": "challenge",
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
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "LinkPreviews",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "requestUrl": {
                        "type": Sequelize.STRING,
                        "field": "requestUrl",
                        "allowNull": false
                    },
                    "title": {
                        "type": Sequelize.STRING,
                        "field": "title",
                        "allowNull": true
                    },
                    "description": {
                        "type": Sequelize.STRING,
                        "field": "description",
                        "allowNull": true
                    },
                    "image": {
                        "type": Sequelize.STRING,
                        "field": "image",
                        "allowNull": true
                    },
                    "responseUrl": {
                        "type": Sequelize.STRING,
                        "field": "responseUrl",
                        "allowNull": true
                    },
                    "lang": {
                        "type": Sequelize.STRING,
                        "field": "lang",
                        "allowNull": true
                    },
                    "querySucceeded": {
                        "type": Sequelize.BOOLEAN,
                        "field": "querySucceeded",
                        "allowNull": false
                    },
                    "failReason": {
                        "type": Sequelize.STRING,
                        "field": "failReason",
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
        },
        {
            fn: "createTable",
            params: [
                "Profiles",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "biography": {
                        "type": Sequelize.STRING,
                        "field": "biography",
                        "allowNull": true
                    },
                    "author": {
                        "type": Sequelize.STRING,
                        "field": "author",
                        "allowNull": false
                    },
                    "image": {
                        "type": Sequelize.STRING,
                        "field": "image",
                        "allowNull": true
                    },
                    "signature": {
                        "type": Sequelize.STRING,
                        "field": "signature",
                        "allowNull": false
                    },
                    "challenge": {
                        "type": Sequelize.STRING,
                        "field": "challenge",
                        "allowNull": false
                    },
                    "imageSignature": {
                        "type": Sequelize.STRING,
                        "field": "imageSignature",
                        "allowNull": true
                    },
                    "imageChallenge": {
                        "type": Sequelize.STRING,
                        "field": "imageChallenge",
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
        },
        {
            fn: "createTable",
            params: [
                "Tips",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "tipId": {
                        "type": Sequelize.STRING,
                        "field": "tipId",
                        "unique": true,
                        "allowNull": false
                    },
                    "url": {
                        "type": Sequelize.STRING,
                        "field": "url",
                        "allowNull": false
                    },
                    "sender": {
                        "type": Sequelize.STRING,
                        "field": "sender",
                        "allowNull": false
                    },
                    "timestamp": {
                        "type": Sequelize.STRING,
                        "field": "timestamp",
                        "allowNull": false
                    },
                    "amount": {
                        "type": Sequelize.STRING,
                        "field": "amount",
                        "allowNull": false
                    },
                    "title": {
                        "type": Sequelize.STRING,
                        "field": "title",
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
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
            fn: "dropTable",
            params: ["BlacklistEntries", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["Comments", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["LinkPreviews", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["Profiles", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["Tips", {
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
