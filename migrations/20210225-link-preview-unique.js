'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * changeColumn "requestUrl" on table "LinkPreviews"
 * changeColumn "url" on table "Tips"
 *
 **/

var info = {
    "revision": 16,
    "name": "link-preview-unique",
    "created": "2021-02-25T09:10:22.402Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "changeColumn",
            params: [
                "LinkPreviews",
                "requestUrl",
                {
                    "type": Sequelize.TEXT,
                    "field": "requestUrl",
                    "unique": true,
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
              "Tips",
              "url",
                {
                    "type": Sequelize.TEXT,
                    "field": "url",
                    "allowNull": true
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
                "LinkPreviews",
                "requestUrl",
                {
                    "type": Sequelize.TEXT,
                    "field": "requestUrl",
                    "allowNull": false,
                    "unique": false,
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "changeColumn",
            params: [
                "Tips",
                "url",
                {
                    "type": Sequelize.STRING,
                    "field": "url",
                    "allowNull": true
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
    up: async function(queryInterface, Sequelize)
    {
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('TRUNCATE TABLE "LinkPreviews" CASCADE;', { transaction });
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: async function(queryInterface, Sequelize)
    {
      await queryInterface.removeConstraint("LinkPreviews", "LinkPreviews_requestUrl_key"); // hangs within transaction, so no transaction
      return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
