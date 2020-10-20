'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Consents", deps: []
 * addIndex "consents_author_scope" to table "Consents"
 *
 **/

var info = {
    "revision": 4,
    "name": "add-consent",
    "created": "2020-10-20T09:04:24.806Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "Consents",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "author": {
                        "type": Sequelize.STRING,
                        "field": "author",
                        "allowNull": false
                    },
                    "scope": {
                        "type": Sequelize.STRING,
                        "field": "scope",
                        "allowNull": false
                    },
                    "status": {
                        "type": Sequelize.ENUM('ALLOWED', 'REJECTED'),
                        "field": "status",
                        "allowNull": false
                    },
                    "signature": {
                        "type": Sequelize.STRING,
                        "field": "signature",
                        "allowNull": false
                    },
                    "challenge": {
                        "type": Sequelize.TEXT,
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
            fn: "addIndex",
            params: [
                "Consents",
                ["author", "scope"],
                {
                    "indexName": "consents_author_scope",
                    "name": "consents_author_scope",
                    "indicesType": "UNIQUE",
                    "type": "UNIQUE",
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
        fn: "dropTable",
        params: ["Consents", {
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
