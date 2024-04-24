import Sequelize from "sequelize";
'use strict';
/**
 * Actions summary:
 *
 * addColumn "challenge" to table "BlacklistEntries"
 * addColumn "signature" to table "BlacklistEntries"
 *
 **/
var info = {
    "revision": 27,
    "name": "add-signature-to-blacklist",
    "created": "2021-07-20T14:00:08.013Z",
    "comment": ""
};
var migrationCommands = function (transaction) {
    return [{
            fn: "addColumn",
            params: [
                "BlacklistEntries",
                "challenge",
                {
                    "type": Sequelize.STRING,
                    "field": "challenge",
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
                "signature",
                {
                    "type": Sequelize.STRING,
                    "field": "signature",
                    "allowNull": true
                },
                {
                    transaction: transaction
                }
            ]
        },
    ];
};
var rollbackCommands = function (transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "BlacklistEntries",
                "challenge",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "BlacklistEntries",
                "signature",
                {
                    transaction: transaction
                }
            ]
        },
    ];
};
export const pos = 0;
export const useTransaction = true;
export const execute = moduleExports.execute;
export const up = moduleExports.up;
export const down = moduleExports.down;
const moduleExports = {
    pos,
    useTransaction,
    execute: function (queryInterface, Sequelize, _commands) {
        var index = this.pos;
        function run(transaction) {
            const commands = _commands(transaction);
            return new Promise(function (resolve, reject) {
                function next() {
                    if (index < commands.length) {
                        let command = commands[index];
                        console.log("[#" + index + "] execute: " + command.fn);
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
        }
        else {
            return run(null);
        }
    },
    up: function (queryInterface, Sequelize) {
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: function (queryInterface, Sequelize) {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
export { info };
export default moduleExports;
