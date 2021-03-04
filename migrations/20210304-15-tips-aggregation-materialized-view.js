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
      await queryInterface.sequelize.query(`
CREATE MATERIALIZED VIEW TipsAggregation AS
SELECT "Tip"."id",
       SUM("Tip"."amount")::VARCHAR AS totalUrlAmount,
       (COALESCE(SUM(COALESCE("Retip"."amount", 0)) + COALESCE("Tip"."amount", 0), 0))::VARCHAR AS totalAmount,
       (COALESCE(SUM(CASE
                        WHEN unclaimed("Retip"."claimGen", "Tip"."url", "Tip"."contractId")
                            THEN COALESCE("Retip"."amount", 0)
                        ELSE 0 END), 0) + (CASE
                                               WHEN unclaimed("Tip"."claimGen", "Tip"."url", "Tip"."contractId")
                                                   THEN COALESCE("Tip"."amount", 0)
                                               ELSE 0 END))::VARCHAR                           AS totalUnclaimedAmount,


       ARRAY(SELECT JSON_BUILD_OBJECT(COALESCE("Retips"."token", "Tip"."token"),
                                      (SUM("Retips"."tokenAmount") + "Tip"."tokenAmount")::VARCHAR)
             FROM "Retips"
             WHERE "Retips"."tipId" = "Tip"."id"
               AND COALESCE("Retips"."token", "Tip"."token") IS NOT NULL
             GROUP BY COALESCE("Retips"."token", "Tip"."token"))                     AS totalTokenAmount,
       ARRAY(SELECT JSON_BUILD_OBJECT(COALESCE("Retips"."token", "Tip"."token"), (SUM(CASE
                                                                                         WHEN unclaimed("Retips"."claimGen", "Tip"."url", "Tip"."contractId")
                                                                                             THEN "Retips"."tokenAmount"
                                                                                         ELSE 0 END) + (CASE
                                                                                                            WHEN unclaimed("Tip"."claimGen", "Tip"."url", "Tip"."contractId")
                                                                                                                THEN "Tip"."tokenAmount"
                                                                                                            ELSE 0 END))::VARCHAR)
             FROM "Retips"
             WHERE "Retips"."tipId" = "Tip"."id"
               AND COALESCE("Retips"."token", "Tip"."token") IS NOT NULL
             GROUP BY COALESCE("Retips"."token", "Tip"."token"))                     AS totalTokenUnclaimedAmount

FROM "Tips" AS "Tip"
         LEFT OUTER JOIN "Retips" AS "Retip" ON "Tip"."id" = "Retip"."tipId"
GROUP BY "Tip"."id", "Tip"."amount";`, { transaction });

      await queryInterface.sequelize.query(`
CREATE FUNCTION refresh_tips_aggregation()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    REFRESH MATERIALIZED VIEW TipsAggregation;
    RETURN NULL;
END
$$;`, { transaction });

      await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_tips_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Tips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_tips_aggregation();`, { transaction });

      await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_tips_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Retips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_tips_aggregation();`, { transaction });

      await transaction.commit();
      return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: async function(queryInterface, Sequelize)
    {
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('DROP MATERIALIZED VIEW TipsAggregation CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP FUNCTION refresh_tips_aggregation CASCADE;', { transaction });
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
