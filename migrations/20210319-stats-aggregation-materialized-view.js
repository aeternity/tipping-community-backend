import Sequelize from "sequelize";
'use strict';
/**
 * Actions summary:
 *
 **/
var info = {
    "revision": 18,
    "name": "stats-aggregation-materialized-view",
    "created": "2021-03-19T10:48:44.945Z",
    "comment": ""
};
var migrationCommands = function (transaction) {
    return [];
};
var rollbackCommands = function (transaction) {
    return [];
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
        await queryInterface.sequelize.query(`
CREATE MATERIALIZED VIEW Stats AS
SELECT (SELECT COUNT("Tips"."id") FROM "Tips")                                                             AS "tipsLength",
       (SELECT COUNT("Retips"."id") FROM "Retips")                                                         AS "retipsLength",
       ((SELECT COUNT("Retips"."id") FROM "Retips") +
        (SELECT COUNT("Tips"."id") FROM "Tips"))                                                           AS "totalTipsLength",
       (SELECT (COALESCE((SELECT (SUM(COALESCE("Tips"."amount", 0))) + SUM((COALESCE("Retips"."amount", 0)))
                          FROM "Tips"
                                   LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"),
                         0))::VARCHAR)                                                                     AS "totalAmount",
       (SELECT (COALESCE((SELECT (SUM(CASE
                                          WHEN unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                              THEN COALESCE("Tips"."amount", 0)
                                          ELSE 0 END)) + SUM((CASE
                                                                  WHEN unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                                                      THEN COALESCE("Retips"."amount", 0)
                                                                  ELSE 0 END))
                          FROM "Tips"
                                   LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"),
                         0))::VARCHAR)                                                                     AS "totalUnclaimedAmount",
       (SELECT (COALESCE((SELECT (SUM(CASE
                                          WHEN unclaimed("Tips"."claimGen", "Tips"."url", "Tips"."contractId")
                                              THEN 0
                                          ELSE COALESCE("Tips"."amount", 0) END)) + SUM((CASE
                                                                                             WHEN unclaimed("Retips"."claimGen", "Tips"."url", "Tips"."contractId")
                                                                                                 THEN 0
                                                                                             ELSE COALESCE("Retips"."amount", 0) END))
                          FROM "Tips"
                                   LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"),
                         0))::VARCHAR)                                                                     AS "totalClaimedAmount",
       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', COALESCE("Retips"."token", "Tips"."token"),
                                       'amount', ((SUM(COALESCE("Retips"."tokenAmount", 0))) +
                                                  (SUM(COALESCE("Tips"."tokenAmount", 0))))::VARCHAR)
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              GROUP BY COALESCE("Retips"."token", "Tips"."token")
              HAVING COALESCE("Retips"."token", "Tips"."token") IS NOT NULL)))                              AS "totalTokenAmount",
       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', COALESCE("Retips"."token", "Tips"."token"),
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
              GROUP BY COALESCE("Retips"."token", "Tips"."token")
              HAVING COALESCE("Retips"."token", "Tips"."token") IS NOT NULL)))                              AS "totalTokenUnclaimedAmount",
       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', COALESCE("Retips"."token", "Tips"."token"),
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
              GROUP BY COALESCE("Retips"."token", "Tips"."token")
              HAVING COALESCE("Retips"."token", "Tips"."token") IS NOT NULL)))                              AS "totalTokenClaimedAmount",
       ARRAY((SELECT "Tips"."sender" FROM "Tips") UNION DISTINCT (SELECT "Retips"."sender" FROM "Retips")) AS "senders",
       (SELECT COUNT(senders)
        FROM ((SELECT "Tips"."sender" FROM "Tips")
              UNION
              DISTINCT
              (SELECT "Retips"."sender" FROM "Retips")) AS senders)                                        AS "sendersLength";
              `, { transaction });
        await queryInterface.sequelize.query(`
CREATE FUNCTION refresh_stats_aggregation()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    REFRESH MATERIALIZED VIEW Stats;
    RETURN NULL;
END
$$;`, { transaction });
        await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_stats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Tips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_stats_aggregation();`, { transaction });
        await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_stats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Retips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_stats_aggregation();`, { transaction });
        await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_stats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Claims"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_stats_aggregation();`, { transaction });
        await transaction.commit();
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: async function (queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        await queryInterface.sequelize.query('DROP MATERIALIZED VIEW Stats CASCADE;', { transaction });
        await queryInterface.sequelize.query('DROP FUNCTION refresh_stats_aggregation CASCADE;', { transaction });
        await transaction.commit();
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
export { info };
export default moduleExports;
