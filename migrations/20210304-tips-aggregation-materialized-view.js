'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 **/

var info = {
    "revision": 18,
    "name": "tips-aggregation-materialized-view",
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

       (SELECT COALESCE(SUM(amounts.amount), 0)::VARCHAR
        FROM (SELECT SUM(COALESCE("Retips"."amount", 0)) AS amount
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."id" = "Tip"."id"
              UNION
              SELECT SUM(COALESCE("Tips"."amount", 0)) AS amount
              FROM "Tips"
              WHERE "Tips"."id" = "Tip"."id") AS amounts
        WHERE amounts.amount > 0)           AS "totalAmount",

       (SELECT COALESCE(SUM(amounts.amount), 0)::VARCHAR
        FROM (SELECT SUM(unclaimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId", "Retips"."amount")) AS amount
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."id" = "Tip"."id"
              UNION
              SELECT SUM(unclaimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId", "Tips"."amount")) AS amount
              FROM "Tips"
              WHERE "Tips"."id" = "Tip"."id") AS amounts
        WHERE amounts.amount > 0)           AS "totalUnclaimedAmount",

       (SELECT COALESCE(SUM(amounts.amount), 0)::VARCHAR
        FROM (SELECT SUM(claimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId", "Retips"."amount")) AS amount
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."id" = "Tip"."id"
              UNION
              SELECT SUM(claimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId", "Tips"."amount")) AS amount
              FROM "Tips"
              WHERE "Tips"."id" = "Tip"."id") AS amounts
        WHERE amounts.amount > 0)           AS "totalClaimedAmount",

       (ARRAY(SELECT JSON_BUILD_OBJECT('token', tokenAmounts.token,
                                       'amount', SUM(tokenAmounts.amount)::VARCHAR)
              FROM (SELECT "Retips"."token", SUM("Retips"."tokenAmount") AS amount
                    FROM "Tips"
                             LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                    WHERE "Tips"."id" = "Tip"."id"
                      AND "Retips"."token" IS NOT NULL
                    GROUP BY "Retips"."token"
                    UNION
                    SELECT "Tips"."token", SUM("Tips"."tokenAmount") AS amount
                    FROM "Tips"
                    WHERE "Tips"."id" = "Tip"."id"
                      AND "Tips"."token" IS NOT NULL
                    GROUP BY "Tips"."token") AS tokenAmounts
              WHERE tokenAmounts.amount > 0
              GROUP BY tokenAmounts.token)) AS "totalTokenAmount",

       (ARRAY(SELECT JSON_BUILD_OBJECT('token', tokenAmounts.token,
                                       'amount', SUM(tokenAmounts.amount)::VARCHAR)
              FROM (SELECT "Retips"."token",
                           SUM(unclaimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId",
                                                "Retips"."tokenAmount")) AS amount
                    FROM "Tips"
                             LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                    WHERE "Tips"."id" = "Tip"."id"
                      AND "Retips"."token" IS NOT NULL
                    GROUP BY "Retips"."token"
                    UNION
                    SELECT "Tips"."token",
                           SUM(unclaimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId",
                                                "Tips"."tokenAmount")) AS amount
                    FROM "Tips"
                    WHERE "Tips"."id" = "Tip"."id"
                      AND "Tips"."token" IS NOT NULL
                    GROUP BY "Tips"."token") AS tokenAmounts
              WHERE tokenAmounts.amount > 0
              GROUP BY tokenAmounts.token)) AS "totalTokenUnclaimedAmount",

       (ARRAY(SELECT JSON_BUILD_OBJECT('token', tokenAmounts.token,
                                       'amount', SUM(tokenAmounts.amount)::VARCHAR)
              FROM (SELECT "Retips"."token",
                           SUM(claimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId",
                                              "Retips"."tokenAmount")) AS amount
                    FROM "Tips"
                             LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                    WHERE "Tips"."id" = "Tip"."id"
                      AND "Retips"."token" IS NOT NULL
                    GROUP BY "Retips"."token"
                    UNION
                    SELECT "Tips"."token",
                           SUM(claimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId",
                                              "Tips"."tokenAmount")) AS amount
                    FROM "Tips"
                    WHERE "Tips"."id" = "Tip"."id"
                      AND "Tips"."token" IS NOT NULL
                    GROUP BY "Tips"."token") AS tokenAmounts
              WHERE tokenAmounts.amount > 0
              GROUP BY tokenAmounts.token)) AS "totalTokenClaimedAmount"

FROM "Tips" AS "Tip"
GROUP BY "Tip"."id";
`, { transaction });

      await queryInterface.sequelize.query(`
CREATE UNIQUE INDEX TipsAggregation_id_idx
    ON TipsAggregation (id);`, { transaction });

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

      await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_tips_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Claims"
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
