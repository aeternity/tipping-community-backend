'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 **/

var info = {
    "revision": 21,
    "name": "noname",
    "created": "2021-03-24T17:52:44.945Z",
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
      await queryInterface.sequelize.query('CREATE INDEX tip_sender_idx ON "Tips" ("sender");', { transaction });
      await queryInterface.sequelize.query('CREATE INDEX retip_sender_idx ON "Retips" ("sender");', { transaction });

      await queryInterface.sequelize.query(`
CREATE MATERIALIZED VIEW SenderStats AS
SELECT "Tip"."sender",
       (SELECT COUNT("Tips"."id") FROM "Tips" WHERE "Tips"."sender" = "Tip"."sender") AS tipsLength,
       (SELECT COUNT("Retips"."id")
        FROM "Retips"
        WHERE "Retips"."sender" = "Tip"."sender")                                     AS retipsLength,
       ((SELECT COUNT("Retips"."id")
         FROM "Retips"
         WHERE "Retips"."sender" = "Tip"."sender") +
        (SELECT COUNT("Tips"."id")
         FROM "Tips"
         WHERE "Tips"."sender" = "Tip"."sender"))                                     AS totalTipsLength,
       (SELECT (COALESCE((SELECT (SUM(CASE
                                          WHEN "Tips"."sender" = "Tip"."sender" THEN COALESCE("Tips"."amount", 0)
                                          ELSE 0 END)) +
                                 SUM((CASE
                                          WHEN "Retips"."sender" = "Tip"."sender"
                                              THEN COALESCE("Retips"."amount", 0)
                                          ELSE 0 END))
                          FROM "Tips"
                                   LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"),
                         0))::VARCHAR)                                                AS totalAmount,
       (SELECT (COALESCE((SELECT (SUM(CASE
                                          WHEN "Tips"."sender" = "Tip"."sender" AND
                                               unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                              THEN COALESCE("Tips"."amount", 0)
                                          ELSE 0 END)) +
                                 SUM((CASE
                                          WHEN "Retips"."sender" = "Tip"."sender" AND
                                               unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                              THEN COALESCE("Retips"."amount", 0)
                                          ELSE 0 END))
                          FROM "Tips"
                                   LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"),
                         0))::VARCHAR)                                                AS totalUnclaimedAmount,
       (SELECT (COALESCE((SELECT (SUM(CASE
                                          WHEN "Tips"."sender" != "Tip"."sender" OR
                                               unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                              THEN 0
                                          ELSE COALESCE("Tips"."amount", 0) END)) +
                                 SUM((CASE
                                          WHEN "Retips"."sender" != "Tip"."sender" OR
                                               unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                              THEN 0
                                          ELSE COALESCE("Retips"."amount", 0) END))
                          FROM "Tips"
                                   LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"),
                         0))::VARCHAR)                                                AS totalClaimedAmount,
       (ARRAY(SELECT JSON_BUILD_OBJECT('token', COALESCE("Retips"."token", "Tips"."token"),
                                       'amount', ((SUM(CASE
                                                           WHEN "Retips"."sender" = "Tip"."sender"
                                                               THEN COALESCE("Retips"."tokenAmount", 0)
                                                           ELSE 0 END)) +
                                                  (SUM(CASE
                                                           WHEN "Tips"."sender" = "Tip"."sender"
                                                               THEN COALESCE("Tips"."tokenAmount", 0)
                                                           ELSE 0 END)))::VARCHAR)
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              GROUP BY COALESCE("Retips"."token", "Tips"."token")
              HAVING COALESCE("Retips"."token", "Tips"."token") IS NOT NULL
                 AND ((SUM(CASE
                               WHEN "Retips"."sender" = "Tip"."sender"
                                   THEN COALESCE("Retips"."tokenAmount", 0)
                               ELSE 0 END)) +
                      (SUM(CASE
                               WHEN "Tips"."sender" = "Tip"."sender"
                                   THEN COALESCE("Tips"."tokenAmount", 0)
                               ELSE 0 END))) > 0))                                    AS totalTokenAmount,
       (ARRAY(SELECT JSON_BUILD_OBJECT('token', COALESCE("Retips"."token", "Tips"."token"),
                                       'amount', ((SUM(CASE
                                                           WHEN "Retips"."sender" = "Tip"."sender" AND
                                                                unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                                               THEN COALESCE("Retips"."tokenAmount", 0)
                                                           ELSE 0 END)) +
                                                  (SUM(CASE
                                                           WHEN "Tips"."sender" = "Tip"."sender" AND
                                                                unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                                               THEN COALESCE("Tips"."tokenAmount", 0)
                                                           ELSE 0 END)))::VARCHAR)
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              GROUP BY COALESCE("Retips"."token", "Tips"."token")
              HAVING COALESCE("Retips"."token", "Tips"."token") IS NOT NULL
                 AND ((SUM(CASE
                               WHEN "Retips"."sender" = "Tip"."sender" AND
                                    unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                   THEN COALESCE("Retips"."tokenAmount", 0)
                               ELSE 0 END)) +
                      (SUM(CASE
                               WHEN "Tips"."sender" = "Tip"."sender" AND
                                    unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                   THEN COALESCE("Tips"."tokenAmount", 0)
                               ELSE 0 END))) > 0))                                    AS totalTokenUnclaimedAmount,
       (ARRAY(SELECT JSON_BUILD_OBJECT('token', COALESCE("Retips"."token", "Tips"."token"),
                                       'amount', ((SUM(CASE
                                                           WHEN "Retips"."sender" != "Tip"."sender" OR
                                                                unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                                               THEN 0
                                                           ELSE COALESCE("Retips"."tokenAmount", 0) END)) +
                                                  (SUM(CASE
                                                           WHEN "Tips"."sender" != "Tip"."sender" OR
                                                                unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                                               THEN 0
                                                           ELSE COALESCE("Tips"."tokenAmount", 0) END)))::VARCHAR)
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              GROUP BY COALESCE("Retips"."token", "Tips"."token")
              HAVING COALESCE("Retips"."token", "Tips"."token") IS NOT NULL
                 AND ((SUM(CASE
                               WHEN "Retips"."sender" != "Tip"."sender" OR
                                    unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                   THEN 0
                               ELSE COALESCE("Retips"."tokenAmount", 0) END)) +
                      (SUM(CASE
                               WHEN "Tips"."sender" != "Tip"."sender" OR
                                    unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                   THEN 0
                               ELSE COALESCE("Tips"."tokenAmount", 0) END))) > 0))    AS totalTokenClaimedAmount
FROM "Tips" as "Tip"
GROUP BY "Tip"."sender";
              `, { transaction });

      await queryInterface.sequelize.query(`
CREATE FUNCTION refresh_senderstats_aggregation()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    REFRESH MATERIALIZED VIEW SenderStats;
    RETURN NULL;
END
$$;`, { transaction });

      await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_senderstats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Tips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_stats_aggregation();`, { transaction });

      await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_senderstats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Retips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_stats_aggregation();`, { transaction });

      await transaction.commit();
      return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: async function(queryInterface, Sequelize)
    {
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('DROP MATERIALIZED VIEW SenderStats CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP INDEX tip_sender_idx;', { transaction });
      await queryInterface.sequelize.query('DROP INDEX retip_sender_idx;', { transaction });

      await queryInterface.sequelize.query('DROP TRIGGER refresh_senderstats_aggregation ON "Tips" CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP TRIGGER refresh_senderstats_aggregation ON "Retips" CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP FUNCTION refresh_senderstats_aggregation CASCADE;', { transaction });
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
