'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "BlacklistEntries", deps: []
 * createTable "ErrorReports", deps: []
 * createTable "IPFSEntries", deps: []
 * createTable "LinkPreviews", deps: []
 * createTable "Notifications", deps: []
 * createTable "Pins", deps: []
 * createTable "Profiles", deps: []
 * createTable "Tips", deps: []
 * createTable "Traces", deps: []
 * createTable "Comments", deps: [Profiles, Comments]
 * createTable "Commentsancestors", deps: [Comments, Comments]
 * createTable "Retips", deps: [Tips]
 * addIndex "pins_entry_id_type_author" to table "Pins"
 *
 **/

var info = {
    "revision": 1,
    "name": "initial-postgres",
    "created": "2020-08-31T12:06:35.069Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "BlacklistEntries",
                {
                    "tipId": {
                        "type": Sequelize.STRING,
                        "field": "tipId",
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "status": {
                        "type": Sequelize.ENUM('flagged', 'hidden'),
                        "field": "status",
                        "allowNull": false,
                        "defaultValue": "hidden"
                    },
                    "flagger": {
                        "type": Sequelize.STRING,
                        "field": "flagger",
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
                "ErrorReports",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "appVersion": {
                        "type": Sequelize.STRING,
                        "field": "appVersion",
                        "allowNull": false
                    },
                    "browser": {
                        "type": Sequelize.TEXT,
                        "field": "browser",
                        "allowNull": false
                    },
                    "error": {
                        "type": Sequelize.TEXT,
                        "field": "error",
                        "allowNull": false
                    },
                    "platform": {
                        "type": Sequelize.STRING,
                        "field": "platform",
                        "allowNull": false
                    },
                    "description": {
                        "type": Sequelize.TEXT,
                        "field": "description",
                        "allowNull": true
                    },
                    "time": {
                        "type": Sequelize.STRING,
                        "field": "time",
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
                "IPFSEntries",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "hash": {
                        "type": Sequelize.STRING,
                        "field": "hash",
                        "allowNull": false
                    },
                    "type": {
                        "type": Sequelize.ENUM('PROFILE_IMAGE', 'COVER_IMAGE'),
                        "field": "type",
                        "allowNull": false
                    },
                    "reference": {
                        "type": Sequelize.STRING,
                        "field": "reference",
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
                        "type": Sequelize.TEXT,
                        "field": "requestUrl",
                        "allowNull": false
                    },
                    "title": {
                        "type": Sequelize.TEXT,
                        "field": "title",
                        "allowNull": true
                    },
                    "description": {
                        "type": Sequelize.TEXT,
                        "field": "description",
                        "allowNull": true
                    },
                    "image": {
                        "type": Sequelize.STRING,
                        "field": "image",
                        "allowNull": true
                    },
                    "responseUrl": {
                        "type": Sequelize.TEXT,
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
                        "type": Sequelize.TEXT,
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
                        "type": Sequelize.ENUM('COMMENT_ON_COMMENT', 'COMMENT_ON_TIP', 'TIP_ON_COMMENT', 'RETIP_ON_TIP', 'CLAIM_OF_TIP', 'CLAIM_OF_RETIP'),
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
        },
        {
            fn: "createTable",
            params: [
                "Pins",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "entryId": {
                        "type": Sequelize.STRING,
                        "field": "entryId",
                        "allowNull": false
                    },
                    "type": {
                        "type": Sequelize.ENUM('TIP'),
                        "field": "type",
                        "allowNull": false
                    },
                    "author": {
                        "type": Sequelize.STRING,
                        "field": "author",
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
            fn: "createTable",
            params: [
                "Profiles",
                {
                    "biography": {
                        "type": Sequelize.TEXT,
                        "field": "biography",
                        "allowNull": true
                    },
                    "author": {
                        "type": Sequelize.STRING,
                        "field": "author",
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "preferredChainName": {
                        "type": Sequelize.STRING,
                        "field": "preferredChainName",
                        "allowNull": true
                    },
                    "image": {
                        "type": Sequelize.STRING,
                        "field": "image",
                        "allowNull": true
                    },
                    "referrer": {
                        "type": Sequelize.STRING,
                        "field": "referrer",
                        "allowNull": true
                    },
                    "location": {
                        "type": Sequelize.TEXT,
                        "field": "location",
                        "allowNull": true
                    },
                    "coverImage": {
                        "type": Sequelize.STRING,
                        "field": "coverImage",
                        "allowNull": true
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
                    "imageSignature": {
                        "type": Sequelize.STRING,
                        "field": "imageSignature",
                        "allowNull": true
                    },
                    "imageChallenge": {
                        "type": Sequelize.TEXT,
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
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "language": {
                        "type": Sequelize.STRING,
                        "field": "language",
                        "allowNull": true
                    },
                    "type": {
                        "type": Sequelize.ENUM('AE_TIP', 'TOKEN_TIP', 'DIRECT_AE_TIP', 'DIRECT_TOKEN_TIP'),
                        "field": "type",
                        "allowNull": false,
                        "defaultValue": "AE_TIP"
                    },
                    "unclaimed": {
                        "type": Sequelize.BOOLEAN,
                        "field": "unclaimed",
                        "defaultValue": true
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
                "Traces",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "url": {
                        "type": Sequelize.TEXT,
                        "field": "url",
                        "allowNull": false
                    },
                    "uuid": {
                        "type": Sequelize.UUID,
                        "field": "uuid",
                        "allowNull": false
                    },
                    "publicKey": {
                        "type": Sequelize.STRING,
                        "field": "publicKey",
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
                        "type": Sequelize.STRING,
                        "field": "tipId",
                        "allowNull": false
                    },
                    "text": {
                        "type": Sequelize.TEXT,
                        "field": "text",
                        "allowNull": false
                    },
                    "author": {
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
                        "type": Sequelize.TEXT,
                        "field": "challenge",
                        "allowNull": false
                    },
                    "parentId": {
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
                    "hierarchyLevel": {
                        "type": Sequelize.INTEGER,
                        "field": "hierarchyLevel"
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
            fn: "createTable",
            params: [
                "Retips",
                {
                    "id": {
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "unclaimed": {
                        "type": Sequelize.BOOLEAN,
                        "field": "unclaimed",
                        "defaultValue": true
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
                        "type": Sequelize.STRING,
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
            fn: "addIndex",
            params: [
                "Pins",
                ["entryId", "type", "author"],
                {
                    "indexName": "pins_entry_id_type_author",
                    "name": "pins_entry_id_type_author",
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
            params: ["Commentsancestors", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["ErrorReports", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["IPFSEntries", {
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
            params: ["Notifications", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["Pins", {
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
            params: ["Retips", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["Tips", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["Traces", {
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
