import Sequelize from "sequelize";
'use strict';
/**
 * Actions summary:
 *
 * createTable "Events", deps: []
 * addIndex "events_name_url_height_time" to table "Events"
 *
 **/
var info = {
    "revision": 21,
    "name": "add-events",
    "created": "2021-04-09T13:27:25.009Z",
    "comment": ""
};
var migrationCommands = function (transaction) {
    return [{
            fn: "createTable",
            params: [
                "Events",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "name": {
                        "type": Sequelize.ENUM('TipReceived', 'TipTokenReceived', 'ReTipReceived', 'ReTipTokenReceived', 'TipDirectReceived', 'TipDirectTokenReceived', 'PostWithoutTipReceived', 'TipWithdrawn', 'QueryOracle', 'CheckPersistClaim', 'Transfer', 'Allowance'),
                        "field": "name",
                        "allowNull": false
                    },
                    "hash": {
                        "type": Sequelize.STRING,
                        "field": "hash",
                        "allowNull": false
                    },
                    "contract": {
                        "type": Sequelize.STRING,
                        "field": "contract",
                        "allowNull": false
                    },
                    "height": {
                        "type": Sequelize.INTEGER,
                        "field": "height",
                        "allowNull": false
                    },
                    "addresses": {
                        "type": Sequelize.ARRAY(Sequelize.STRING),
                        "field": "addresses",
                        "allowNull": false
                    },
                    "url": {
                        "type": Sequelize.TEXT,
                        "field": "url",
                        "allowNull": true
                    },
                    "amount": {
                        "type": Sequelize.STRING,
                        "field": "amount",
                        "allowNull": true
                    },
                    "nonce": {
                        "type": Sequelize.INTEGER,
                        "field": "nonce",
                        "allowNull": true
                    },
                    "time": {
                        "type": Sequelize.BIGINT,
                        "field": "time",
                        "allowNull": true
                    },
                    "data": {
                        "type": Sequelize.JSONB,
                        "field": "data",
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
                "Events",
                ["name", "url", "height", "time"],
                {
                    "indexName": "events_name_url_height_time",
                    "name": "events_name_url_height_time",
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function (transaction) {
    return [{
            fn: "dropTable",
            params: ["Events", {
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
