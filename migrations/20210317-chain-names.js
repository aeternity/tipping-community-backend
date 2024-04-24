import Sequelize from "sequelize";
'use strict';
/**
 * Actions summary:
 *
 * createTable "ChainNames", deps: []
 *
 **/
var info = {
    "revision": 17,
    "name": "chain-names",
    "created": "2021-03-17T12:01:07.037Z",
    "comment": ""
};
var migrationCommands = function (transaction) {
    return [{
            fn: "createTable",
            params: [
                "ChainNames",
                {
                    "publicKey": {
                        "type": Sequelize.STRING,
                        "field": "publicKey",
                        "allowNull": false,
                        "primaryKey": true
                    },
                    "name": {
                        "type": Sequelize.STRING,
                        "field": "name",
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
        }];
};
var rollbackCommands = function (transaction) {
    return [{
            fn: "dropTable",
            params: ["ChainNames", {
                    transaction: transaction
                }]
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
