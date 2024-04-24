import Sequelize from "sequelize";
'use strict';
/**
 * Actions summary:
 *
 **/
var info = {
    "revision": 19,
    "name": "sender-aggregation-materialized-view",
    "created": "2021-03-24T17:52:44.945Z",
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
        await queryInterface.sequelize.query('CREATE INDEX tip_sender_idx ON "Tips" ("sender");', { transaction });
        await queryInterface.sequelize.query('CREATE INDEX retip_sender_idx ON "Retips" ("sender");', { transaction });
        await queryInterface.sequelize.query(`
CREATE MATERIALIZED VIEW SenderStats AS
SELECT "Tip"."sender",

       (SELECT COUNT("Tips"."id") FROM "Tips" WHERE "Tips"."sender" = "Tip"."sender") AS "tipsLength",

       (SELECT COUNT("Retips"."id")
        FROM "Retips"
        WHERE "Retips"."sender" = "Tip"."sender")                                     AS "retipsLength",

       ((SELECT COUNT("Retips"."id")
         FROM "Retips"
         WHERE "Retips"."sender" = "Tip"."sender") +
        (SELECT COUNT("Tips"."id")
         FROM "Tips"
         WHERE "Tips"."sender" = "Tip"."sender"))                                     AS "totalTipsLength",

       (SELECT COALESCE(SUM(amounts.amount), 0)::VARCHAR
        FROM (SELECT SUM(COALESCE("Retips"."amount", 0)) AS amount
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."sender" = "Tip"."sender"
              UNION
              SELECT SUM(COALESCE("Tips"."amount", 0)) AS amount
              FROM "Tips"
              WHERE "Tips"."sender" = "Tip"."sender") AS amounts
        WHERE amounts.amount > 0)           AS totalAmount,

       (SELECT COALESCE(SUM(amounts.amount), 0)::VARCHAR
        FROM (SELECT SUM(unclaimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId", "Retips"."amount")) AS amount
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."sender" = "Tip"."sender"
              UNION
              SELECT SUM(unclaimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId", "Tips"."amount")) AS amount
              FROM "Tips"
              WHERE "Tips"."sender" = "Tip"."sender") AS amounts
        WHERE amounts.amount > 0)           AS "totalUnclaimedAmount",

       (SELECT COALESCE(SUM(amounts.amount), 0)::VARCHAR
        FROM (SELECT SUM(claimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId", "Retips"."amount")) AS amount
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."sender" = "Tip"."sender"
              UNION
              SELECT SUM(claimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId", "Tips"."amount")) AS amount
              FROM "Tips"
              WHERE "Tips"."sender" = "Tip"."sender") AS amounts
        WHERE amounts.amount > 0)           AS "totalClaimedAmount",

       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', tokenAmounts.token,
                                       'amount', SUM(tokenAmounts.amount)::VARCHAR)
              FROM (SELECT "Retips"."token", SUM("Retips"."tokenAmount") AS amount
                    FROM "Tips"
                             LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                    WHERE "Tips"."sender" = "Tip"."sender"
                      AND "Retips"."token" IS NOT NULL
                    GROUP BY "Retips"."token"
                    UNION
                    SELECT "Tips"."token", SUM("Tips"."tokenAmount") AS amount
                    FROM "Tips"
                    WHERE "Tips"."sender" = "Tip"."sender"
                      AND "Tips"."token" IS NOT NULL
                    GROUP BY "Tips"."token") AS tokenAmounts
              WHERE tokenAmounts.amount > 0
              GROUP BY tokenAmounts.token)))                                           AS "totalTokenAmount",

       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', tokenAmounts.token,
                                       'amount', SUM(tokenAmounts.amount)::VARCHAR)
              FROM (SELECT "Retips"."token",
                           SUM(unclaimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId",
                                                "Retips"."tokenAmount")) AS amount
                    FROM "Tips"
                             LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                    WHERE "Tips"."sender" = "Tip"."sender"
                      AND "Retips"."token" IS NOT NULL
                    GROUP BY "Retips"."token"
                    UNION
                    SELECT "Tips"."token",
                           SUM(unclaimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId",
                                                "Tips"."tokenAmount")) AS amount
                    FROM "Tips"
                    WHERE "Tips"."sender" = "Tip"."sender"
                      AND "Tips"."token" IS NOT NULL
                    GROUP BY "Tips"."token") AS tokenAmounts
              WHERE tokenAmounts.amount > 0
              GROUP BY tokenAmounts.token)))                                           AS "totalTokenUnclaimedAmount",

       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', tokenAmounts.token,
                                       'amount', SUM(tokenAmounts.amount)::VARCHAR)
              FROM (SELECT "Retips"."token",
                           SUM(claimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId",
                                              "Retips"."tokenAmount")) AS amount
                    FROM "Tips"
                             LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                    WHERE "Tips"."sender" = "Tip"."sender"
                      AND "Retips"."token" IS NOT NULL
                    GROUP BY "Retips"."token"
                    UNION
                    SELECT "Tips"."token",
                           SUM(claimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId",
                                              "Tips"."tokenAmount")) AS amount
                    FROM "Tips"
                    WHERE "Tips"."sender" = "Tip"."sender"
                      AND "Tips"."token" IS NOT NULL
                    GROUP BY "Tips"."token") AS tokenAmounts
              WHERE tokenAmounts.amount > 0
              GROUP BY tokenAmounts.token)))                                           AS "totalTokenClaimedAmount"
FROM "Tips" as "Tip"
GROUP BY "Tip"."sender";
              `, { transaction });
        await queryInterface.sequelize.query(`
CREATE UNIQUE INDEX SenderStats_sender_idx
    ON SenderStats (sender);`, { transaction });
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
EXECUTE PROCEDURE refresh_senderstats_aggregation();`, { transaction });
        await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_senderstats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Retips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_senderstats_aggregation();`, { transaction });
        await queryInterface.sequelize.query(`
CREATE TRIGGER refresh_senderstats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Claims"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_senderstats_aggregation();`, { transaction });
        await transaction.commit();
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: async function (queryInterface, Sequelize) {
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
export { info };
export default moduleExports;
