'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 **/

var info = {
    "revision": 14,
    "name": "noname",
    "created": "2021-03-04T10:48:44.945Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [];
};
var rollbackCommands = function(transaction) {
    return [];
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
      await queryInterface.sequelize.query('CREATE FUNCTION total_amount(varchar) RETURNS numeric AS \'SELECT COALESCE(SUM("Retip"."amount"), 0) + "Tip"."amount" FROM "Tips" AS "Tip" LEFT OUTER JOIN "Retips" AS "Retip" ON "Tip"."id" = "Retip"."tipId" WHERE "Tip"."id" = $1 GROUP BY "Tip"."id", "Tip"."amount";\' LANGUAGE SQL IMMUTABLE;', { transaction });
      await queryInterface.sequelize.query('CREATE FUNCTION total_unclaimed_amount(varchar) RETURNS numeric AS \'SELECT COALESCE(SUM(CASE WHEN unclaimed("Retip"."claimGen", "Tip"."url", "Tip"."contractId") THEN "Retip"."amount" ELSE 0 END), 0) + (CASE WHEN unclaimed("Tip"."claimGen", "Tip"."url", "Tip"."contractId") THEN "Tip"."amount" ELSE 0 END) FROM "Tips" AS "Tip" LEFT OUTER JOIN "Retips" AS "Retip" ON "Tip"."id" = "Retip"."tipId" WHERE "Tip"."id" = $1 GROUP BY "Tip"."id", "Tip"."amount";\' LANGUAGE SQL IMMUTABLE;', { transaction });
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: async function(queryInterface, Sequelize)
    {
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('DROP FUNCTION total_amount(varchar);', { transaction });
      await queryInterface.sequelize.query('DROP FUNCTION total_unclaimed_amount(varchar);', { transaction });
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
