import Sequelize from "sequelize";
'use strict';
/**
 * Actions summary:
 *
 * addColumn "media" to table "Tips"
 *
 **/
var info = {
    "revision": 6,
    "name": "add-tip-media",
    "created": "2020-11-09T13:15:34.866Z",
    "comment": ""
};
var migrationCommands = function (transaction) {
    return [{
            fn: "addColumn",
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
var rollbackCommands = function (transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "Tips",
                "media",
                {
                    transaction: transaction
                }
            ]
        }];
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
