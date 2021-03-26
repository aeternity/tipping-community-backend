'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 **/

var info = {
    "revision": 20,
    "name": "noname",
    "created": "2021-03-24T17:48:44.945Z",
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
      await queryInterface.sequelize.query('CREATE INDEX tip_url_idx ON "Tips" ("url");', { transaction });

      await queryInterface.sequelize.query(`
CREATE MATERIALIZED VIEW UrlStats AS
SELECT "Tip"."url",
       (SELECT COUNT("Tips"."id") FROM "Tips" WHERE "Tips"."url" = "Tip"."url") AS tipsLength,
       (SELECT COUNT("Retips"."id")
        FROM "Tips"
                 LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
        WHERE "Tips"."url" = "Tip"."url")                                       AS retipsLength,
       ((SELECT COUNT("Retips"."id")
         FROM "Tips"
                  LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
         WHERE "Tips"."url" = "Tip"."url") +
        (SELECT COUNT("Tips"."id")
         FROM "Tips"
         WHERE "Tips"."url" = "Tip"."url"))                                     AS totalTipsLength,
       (SELECT (COALESCE((SELECT (SUM(COALESCE("Tips"."amount", 0))) +
                                 SUM((COALESCE("Retips"."amount", 0)))
                          FROM "Tips"
                                   LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                          WHERE "Tips"."url" = "Tip"."url"),
                         0))::VARCHAR)                                          AS totalAmount,
       (SELECT (COALESCE((SELECT (SUM(CASE
                                          WHEN unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                              THEN COALESCE("Tips"."amount", 0)
                                          ELSE 0 END)) +
                                 SUM((CASE
                                          WHEN unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                              THEN COALESCE("Retips"."amount", 0)
                                          ELSE 0 END))
                          FROM "Tips"
                                   LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                          WHERE "Tips"."url" = "Tip"."url"),
                         0))::VARCHAR)                                          AS totalUnclaimedAmount,
       (SELECT (COALESCE((SELECT (SUM(CASE
                                          WHEN unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                              THEN 0
                                          ELSE COALESCE("Tips"."amount", 0) END)) +
                                 SUM((CASE
                                          WHEN unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                              THEN 0
                                          ELSE COALESCE("Retips"."amount", 0) END))
                          FROM "Tips"
                                   LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                          WHERE "Tips"."url" = "Tip"."url"),
                         0))::VARCHAR)                                          AS totalClaimedAmount,
       (ARRAY(SELECT JSON_BUILD_OBJECT('token', COALESCE("Retips"."token", "Tips"."token"),
                                       'amount', ((SUM(COALESCE("Retips"."tokenAmount", 0))) +
                                                  (SUM(COALESCE("Tips"."tokenAmount", 0))))::VARCHAR)
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."url" = "Tip"."url"

              GROUP BY COALESCE("Retips"."token", "Tips"."token")
              HAVING COALESCE("Retips"."token", "Tips"."token") IS NOT NULL
                 AND ((SUM(COALESCE("Retips"."tokenAmount", 0))) +
                      (SUM(COALESCE("Tips"."tokenAmount", 0)))) >
                     0))                                                        AS totalTokenAmount,
       (ARRAY(SELECT JSON_BUILD_OBJECT('token', COALESCE("Retips"."token", "Tips"."token"),
                                       'amount', ((SUM(CASE
                                                           WHEN unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                                               THEN COALESCE("Retips"."tokenAmount", 0)
                                                           ELSE 0 END)) +
                                                  (SUM(CASE
                                                           WHEN unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                                               THEN COALESCE("Tips"."tokenAmount", 0)
                                                           ELSE 0 END)))::VARCHAR)
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."url" = "Tip"."url"

              GROUP BY COALESCE("Retips"."token", "Tips"."token")
              HAVING COALESCE("Retips"."token", "Tips"."token") IS NOT NULL
                 AND ((SUM(CASE
                               WHEN unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                   THEN COALESCE("Retips"."tokenAmount", 0)
                               ELSE 0 END)) +
                      (SUM(CASE
                               WHEN unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                   THEN COALESCE("Tips"."tokenAmount", 0)
                               ELSE 0 END))) >
                     0))                                                        AS totalTokenUnclaimedAmount,
       (ARRAY(SELECT JSON_BUILD_OBJECT('token', COALESCE("Retips"."token", "Tips"."token"),
                                       'amount', ((SUM(CASE
                                                           WHEN unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                                               THEN 0
                                                           ELSE COALESCE("Retips"."tokenAmount", 0) END)) +
                                                  (SUM(CASE
                                                           WHEN unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                                               THEN 0
                                                           ELSE COALESCE("Tips"."tokenAmount", 0) END)))::VARCHAR)
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."url" = "Tip"."url"
              GROUP BY COALESCE("Retips"."token", "Tips"."token")
              HAVING COALESCE("Retips"."token", "Tips"."token") IS NOT NULL
                 AND ((SUM(CASE
                               WHEN unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                   THEN 0
                               ELSE COALESCE("Retips"."tokenAmount", 0) END)) +
                      (SUM(CASE
                               WHEN unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                   THEN 0
                               ELSE COALESCE("Tips"."tokenAmount", 0) END))) >
                     0))                                                        AS totalTokenClaimedAmount,
       ARRAY((SELECT "Tips"."sender" FROM "Tips" WHERE "Tips"."url" = "Tip"."url" AND "Tips"."sender" IS NOT NULL)
             UNION
             DISTINCT
             (SELECT "Retips"."sender"
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."url" = "Tip"."url"
                AND "Retips"."sender" IS NOT NULL))                             AS senders,
       (SELECT COUNT(senders)
        FROM ((SELECT "Tips"."sender" FROM "Tips" WHERE "Tips"."url" = "Tip"."url" AND "Tips"."sender" IS NOT NULL)
              UNION
              DISTINCT
              (SELECT "Retips"."sender"
               FROM "Tips"
                        LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
               WHERE "Tips"."url" = "Tip"."url"
                 AND "Retips"."sender" IS NOT NULL)) AS senders)                AS sendersLength
FROM "Tips" as "Tip"
GROUP BY "Tip"."url";
              `, { transaction });

      await queryInterface.sequelize.query(`
CREATE FUNCTION refresh_urlstats_aggregation()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    REFRESH MATERIALIZED VIEW UrlStats;
    RETURN NULL;
END
$$;`, { transaction });

      await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_urlstats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Tips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_urlstats_aggregation();`, { transaction });

      await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_urlstats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Retips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_urlstats_aggregation();`, { transaction });

      await transaction.commit();
      return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: async function(queryInterface, Sequelize)
    {
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.sequelize.query('DROP MATERIALIZED VIEW UrlStats CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP INDEX tip_url_idx;', { transaction });
      await queryInterface.sequelize.query('DROP TRIGGER refresh_urlstats_aggregation ON "Tips" CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP TRIGGER refresh_urlstats_aggregation ON "Retips" CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP FUNCTION refresh_urlstats_aggregation CASCADE;', { transaction });
      await transaction.commit();

      return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
