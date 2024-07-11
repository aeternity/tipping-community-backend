'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addIndex "notifications_type_entity_id_entity_type_receiver" to table "Notifications"
 *
 **/

var info = {
  'revision': 29,
  'name': 'add-index-unique-notifications',
  'created': '2024-07-11T11:41:47.319Z',
  'comment': ''
};

var migrationCommands = function (transaction) {
  return [];
};
var rollbackCommands = function (transaction) {
  return [{
    fn: 'removeIndex',
    params: [
      'Notifications',
      'notifications_type_entity_id_entity_type_receiver',
      {
        transaction: transaction
      }
    ]
  },
  ];
};

module.exports = {
  pos: 0,
  useTransaction: true,
  execute: function (queryInterface, Sequelize, _commands) {
    var index = this.pos;

    function run(transaction) {
      const commands = _commands(transaction);
      return new Promise(function (resolve, reject) {
        function next() {
          if (index < commands.length) {
            let command = commands[index];
            console.log('[#' + index + '] execute: ' + command.fn);
            index++;
            queryInterface[command.fn].apply(queryInterface, command.params)
              .then(next, reject);
          } else {
            resolve();
          }
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
  up: async function (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    // DROP ALL NOTIFICATIONS THAT WOULD HINDER THE INDEX
    await queryInterface.sequelize.query('DELETE FROM "Notifications"\n' +
      'WHERE "id" IN (\n' +
      '    SELECT "id"\n' +
      '    FROM (\n' +
      '        SELECT \n' +
      '            "id",\n' +
      '            ROW_NUMBER() OVER (\n' +
      '                PARTITION BY "type", "entityId", "entityType", "receiver"\n' +
      '                ORDER BY "id"\n' +
      '            ) AS row_num\n' +
      '        FROM "Notifications"\n' +
      '        WHERE "sourceType" IS NULL AND "sourceId" IS NULL\n' +
      '    ) sub\n' +
      '    WHERE sub.row_num > 1\n' +
      ');', { transaction });
    // CREATE INDEX MANUALLY BECAUSE SEQUELIZE HAS ISSUES WITH WHERE IS NULL
    await queryInterface.sequelize.query('CREATE UNIQUE INDEX "notifications_type_entity_id_entity_type_receiver" ON "Notifications" ("type", "entityId", "entityType", "receiver") WHERE "sourceType" IS NULL AND "sourceId" IS NULL;', { transaction });
    await transaction.commit();
    return this.execute(queryInterface, Sequelize, migrationCommands);
  },
  down: function (queryInterface, Sequelize) {
    return this.execute(queryInterface, Sequelize, rollbackCommands);
  },
  info: info
};
