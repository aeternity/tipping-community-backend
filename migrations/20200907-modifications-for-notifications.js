import Sequelize from "sequelize";
'use strict';
/**
 * Actions summary:
 *
 * addColumn "sourceType" to table "Notifications"
 * addColumn "sourceId" to table "Notifications"
 * addColumn "sender" to table "Retips"
 * addColumn "sender" to table "Tips"
 * addIndex "notifications_type_entity_id_entity_type_receiver_source_type_source_id" to table "Notifications"
 *
 **/
var info = {
    "revision": 2,
    "name": "modifications-for-notifications",
    "created": "2020-09-07T11:57:28.698Z",
    "comment": ""
};
var migrationCommands = function (transaction) {
    return [{
            fn: "addColumn",
            params: [
                "Notifications",
                "sourceType",
                {
                    "type": Sequelize.ENUM('COMMENT', 'TIP', 'CLAIM', 'RETIP'),
                    "field": "sourceType",
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
                "Notifications",
                "sourceId",
                {
                    "type": Sequelize.STRING,
                    "field": "sourceId",
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
                "Retips",
                "sender",
                {
                    "type": Sequelize.STRING,
                    "field": "sender"
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "Tips",
                "sender",
                {
                    "type": Sequelize.STRING,
                    "field": "sender"
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "Notifications",
                ["type", "entityId", "entityType", "receiver", "sourceType", "sourceId"],
                {
                    "indexName": "notifications_type_entity_id_entity_type_receiver_source_type_source_id",
                    "name": "notifications_type_entity_id_entity_type_receiver_source_type_source_id",
                    "indicesType": "UNIQUE",
                    "type": "UNIQUE",
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function (transaction) {
    return [{
            fn: "removeIndex",
            params: [
                "Notifications",
                "notifications_type_entity_id_entity_type_receiver_source_type_source_id",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Notifications",
                "sourceType",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Notifications",
                "sourceId",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Retips",
                "sender",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "Tips",
                "sender",
                {
                    transaction: transaction
                }
            ]
        }
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
    up: async function (queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        await queryInterface.sequelize.query('TRUNCATE TABLE "Retips" CASCADE;', { transaction });
        await queryInterface.sequelize.query('TRUNCATE TABLE "Tips" CASCADE;', { transaction });
        await queryInterface.sequelize.query('TRUNCATE TABLE "Notifications";', { transaction });
        await transaction.commit();
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: function (queryInterface, Sequelize) {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
export { info };
export default moduleExports;
