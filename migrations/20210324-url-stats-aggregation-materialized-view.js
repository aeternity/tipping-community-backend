import Sequelize from "sequelize";
("use strict");
/**
 * Actions summary:
 *
 **/
var info = {
  revision: 20,
  name: "url-stats-aggregation-materialized-view",
  created: "2021-03-24T17:48:44.945Z",
  comment: "",
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
          } else resolve();
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
    await queryInterface.sequelize.query('CREATE INDEX tip_url_idx ON "Tips" ("url");', { transaction });
    await queryInterface.sequelize.query(
      `
CREATE MATERIALIZED VIEW UrlStats AS
SELECT "Tip"."url",

       (SELECT COUNT("Tips"."id") FROM "Tips" WHERE "Tips"."url" = "Tip"."url") AS "tipsLength",

       (SELECT COUNT("Retips"."id")
        FROM "Tips"
                 LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
        WHERE "Tips"."url" = "Tip"."url")                                       AS "retipsLength",

       ((SELECT COUNT("Retips"."id")
         FROM "Tips"
                  LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
         WHERE "Tips"."url" = "Tip"."url") +
        (SELECT COUNT("Tips"."id")
         FROM "Tips"
         WHERE "Tips"."url" = "Tip"."url"))                                     AS "totalTipsLength",

       (SELECT COALESCE(SUM(amounts.amount), 0)::VARCHAR
        FROM (SELECT SUM(COALESCE("Retips"."amount", 0)) AS amount
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."url" = "Tip"."url"
              UNION
              SELECT SUM(COALESCE("Tips"."amount", 0)) AS amount
              FROM "Tips"
              WHERE "Tips"."url" = "Tip"."url") AS amounts
        WHERE amounts.amount > 0)           AS "totalAmount",

       (SELECT COALESCE(SUM(amounts.amount), 0)::VARCHAR
        FROM (SELECT SUM(unclaimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId", "Retips"."amount")) AS amount
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."url" = "Tip"."url"
              UNION
              SELECT SUM(unclaimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId", "Tips"."amount")) AS amount
              FROM "Tips"
              WHERE "Tips"."url" = "Tip"."url") AS amounts
        WHERE amounts.amount > 0)           AS "totalUnclaimedAmount",

       (SELECT COALESCE(SUM(amounts.amount), 0)::VARCHAR
        FROM (SELECT SUM(claimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId", "Retips"."amount")) AS amount
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."url" = "Tip"."url"
              UNION
              SELECT SUM(claimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId", "Tips"."amount")) AS amount
              FROM "Tips"
              WHERE "Tips"."url" = "Tip"."url") AS amounts
        WHERE amounts.amount > 0)           AS "totalClaimedAmount",

       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', tokenAmounts.token,
                                       'amount', SUM(tokenAmounts.amount)::VARCHAR)
              FROM (SELECT "Retips"."token", SUM(COALESCE("Retips"."tokenAmount", 0)) AS amount
                    FROM "Tips"
                             LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                    WHERE "Tips"."url" = "Tip"."url"
                      AND "Retips"."token" IS NOT NULL
                    GROUP BY "Retips"."token"
                    UNION
                    SELECT "Tips"."token", SUM(COALESCE("Tips"."tokenAmount", 0)) AS amount
                    FROM "Tips"
                    WHERE "Tips"."url" = "Tip"."url"
                      AND "Tips"."token" IS NOT NULL
                    GROUP BY "Tips"."token") AS tokenAmounts
              WHERE tokenAmounts.amount > 0
              GROUP BY tokenAmounts.token)))                                     AS "totalTokenAmount",

       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', tokenAmounts.token,
                                       'amount', SUM(tokenAmounts.amount)::VARCHAR)
              FROM (SELECT "Retips"."token",
                           SUM(unclaimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId",
                                                "Retips"."tokenAmount")) AS amount
                    FROM "Tips"
                             LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                    WHERE "Tips"."url" = "Tip"."url"
                      AND "Retips"."token" IS NOT NULL
                    GROUP BY "Retips"."token"
                    UNION
                    SELECT "Tips"."token",
                           SUM(unclaimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId",
                                                "Tips"."tokenAmount")) AS amount
                    FROM "Tips"
                    WHERE "Tips"."url" = "Tip"."url"
                      AND "Tips"."token" IS NOT NULL
                    GROUP BY "Tips"."token") AS tokenAmounts
              WHERE tokenAmounts.amount > 0
              GROUP BY tokenAmounts.token)))                                     AS "totalTokenUnclaimedAmount",

       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', tokenAmounts.token,
                                       'amount', SUM(tokenAmounts.amount)::VARCHAR)
              FROM (SELECT "Retips"."token",
                           SUM(claimed_amount("Retips"."claimGen", "Tips"."url", "Tips"."contractId",
                                              "Retips"."tokenAmount")) AS amount
                    FROM "Tips"
                             LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
                    WHERE "Tips"."url" = "Tip"."url"
                      AND "Retips"."token" IS NOT NULL
                    GROUP BY "Retips"."token"
                    UNION
                    SELECT "Tips"."token",
                           SUM(claimed_amount("Tips"."claimGen", "Tips"."url", "Tips"."contractId",
                                              "Tips"."tokenAmount")) AS amount
                    FROM "Tips"
                    WHERE "Tips"."url" = "Tip"."url"
                      AND "Tips"."token" IS NOT NULL
                    GROUP BY "Tips"."token") AS tokenAmounts
              WHERE tokenAmounts.amount > 0
              GROUP BY tokenAmounts.token)))                                     AS "totalTokenClaimedAmount",

       ARRAY((SELECT "Tips"."sender" FROM "Tips" WHERE "Tips"."url" = "Tip"."url" AND "Tips"."sender" IS NOT NULL)
             UNION
             DISTINCT
             (SELECT "Retips"."sender"
              FROM "Tips"
                       LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
              WHERE "Tips"."url" = "Tip"."url"
                AND "Retips"."sender" IS NOT NULL))                             AS "senders",

       (SELECT COUNT(senders)
        FROM ((SELECT "Tips"."sender" FROM "Tips" WHERE "Tips"."url" = "Tip"."url" AND "Tips"."sender" IS NOT NULL)
              UNION
              DISTINCT
              (SELECT "Retips"."sender"
               FROM "Tips"
                        LEFT OUTER JOIN "Retips" ON "Tips"."id" = "Retips"."tipId"
               WHERE "Tips"."url" = "Tip"."url"
                 AND "Retips"."sender" IS NOT NULL)) AS senders)                AS "sendersLength"

FROM "Tips" as "Tip"
GROUP BY "Tip"."url";
              `,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `
CREATE UNIQUE INDEX UrlStats_url_idx
    ON UrlStats (url);`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `
CREATE FUNCTION refresh_urlstats_aggregation()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    REFRESH MATERIALIZED VIEW UrlStats;
    RETURN NULL;
END
$$;`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `
CREATE TRIGGER refresh_urlstats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Tips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_urlstats_aggregation();`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `
CREATE TRIGGER refresh_urlstats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Retips"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_urlstats_aggregation();`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `
CREATE TRIGGER refresh_urlstats_aggregation
    AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
    ON "Claims"
    FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_urlstats_aggregation();`,
      { transaction },
    );
    await transaction.commit();
    return this.execute(queryInterface, Sequelize, migrationCommands);
  },
  down: async function (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    await queryInterface.sequelize.query("DROP MATERIALIZED VIEW UrlStats CASCADE;", { transaction });
    await queryInterface.sequelize.query("DROP INDEX tip_url_idx;", { transaction });
    await queryInterface.sequelize.query('DROP TRIGGER refresh_urlstats_aggregation ON "Tips" CASCADE;', { transaction });
    await queryInterface.sequelize.query('DROP TRIGGER refresh_urlstats_aggregation ON "Retips" CASCADE;', { transaction });
    await queryInterface.sequelize.query("DROP FUNCTION refresh_urlstats_aggregation CASCADE;", { transaction });
    await transaction.commit();
    return this.execute(queryInterface, Sequelize, rollbackCommands);
  },
  info: info,
};
export { info };
export default moduleExports;
