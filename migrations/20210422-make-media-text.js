'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * changeColumn "media" on table "Tips"
 *
 **/

var info = {
    "revision": 26,
    "name": "make-media-text",
    "created": "2021-04-22T10:40:14.945Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
        fn: "changeColumn",
        params: [
            "Tips",
            "media",
            {
                "type": Sequelize.ARRAY(Sequelize.TEXT),
                "field": "media",
                "allowNull": true
            },
            {
                transaction: transaction
            }
        ]
    }];
};
var rollbackCommands = function(transaction) {
    return [{
        fn: "changeColumn",
        params: [
            "Tips",
            "media",
            {
                "type": Sequelize.ARRAY(Sequelize.STRING),
                "field": "media",
                "allowNull": true
            },
            {
                transaction: transaction
            }
        ]
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
