/* eslint-disable max-len */

module.exports = {
  GLOBAL_STATS: 'SELECT stats.* as "stats" FROM stats',
  URL_STATS: 'SELECT urlstats.* as "urlStats" FROM urlstats',
  URL_STATS_BY_URL: 'SELECT urlstats.* as "urlStats" FROM urlstats WHERE url = ?;',
  SUM_URL_STATS_FOR_URLS: 'SELECT SUM(urlstats."totalTipsLength") AS "totalTipsLength", SUM(urlstats."totalAmount"::NUMERIC)::VARCHAR AS "totalAmount" FROM urlstats WHERE url IN (?);',
  SENDER_STATS: 'SELECT ROW_TO_JSON(senderstats.*) as senderstats FROM senderstats WHERE sender = ?;',
  MARKETING_STATS: `SELECT
       (SELECT COUNT("Tips"."id") FROM "Tips" WHERE "Tips"."timestamp" BETWEEN NOW() - INTERVAL ? DAY AND NOW()) AS "tipsCount",
       (SELECT COUNT("Retips"."id") FROM "Retips" WHERE "Retips"."createdAt" BETWEEN NOW() - INTERVAL ? DAY AND NOW()) AS "retipsCount",
       (SELECT COUNT(DISTINCT("Tips"."sender")) FROM "Tips" WHERE "Tips"."timestamp" BETWEEN NOW() - INTERVAL ? DAY AND NOW()) AS "uniqueTippers",
       (SELECT COUNT(DISTINCT("Retips"."sender")) FROM "Retips" WHERE "Retips"."createdAt" BETWEEN NOW() - INTERVAL ? DAY AND NOW()) AS "uniqueRetippers",
       (SELECT COUNT("Comments"."id") FROM "Comments" WHERE "Comments"."createdAt" BETWEEN NOW() - INTERVAL ? DAY AND NOW()) AS "commentCount",
       (SELECT COUNT(DISTINCT("Comments"."author")) FROM "Comments" WHERE "Comments"."createdAt" BETWEEN NOW() - INTERVAL ? DAY AND NOW()) AS "uniqueCommentors",
       (SELECT COUNT("Profiles"."author") FROM "Profiles" WHERE "Profiles"."createdAt" BETWEEN NOW() - INTERVAL ? DAY AND NOW()) AS "profileCount",
       (SELECT COUNT("BlacklistEntries"."tipId") FROM "BlacklistEntries" WHERE "BlacklistEntries"."createdAt" BETWEEN NOW() - INTERVAL ? DAY AND NOW()) AS "blacklistCount",
       (SELECT COALESCE(SUM(COALESCE("Tips"."amount", 0)), 0) AS amount FROM "Tips" WHERE "Tips"."timestamp" BETWEEN NOW() - INTERVAL ? DAY AND NOW()) AS "tipAmount",
       (SELECT COALESCE(SUM(COALESCE("Retips"."amount", 0)), 0) AS amount FROM "Retips" WHERE "Retips"."createdAt" BETWEEN NOW() - INTERVAL ? DAY AND NOW()) AS "retipAmount",
       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', tokenAmounts.token,
                                                 'amount', SUM(tokenAmounts.amount)::VARCHAR)
                       FROM (SELECT "Tips"."token", SUM(COALESCE("Tips"."tokenAmount", 0)) AS amount
                             FROM "Tips"
                             WHERE "Tips"."timestamp" BETWEEN NOW() - INTERVAL ? DAY AND NOW()
                               AND "Tips"."token" IS NOT NULL
                             GROUP BY "Tips"."token") AS tokenAmounts
                       WHERE tokenAmounts.amount > 0
                       GROUP BY tokenAmounts.token))) AS "tipTokenAmount",
       (TO_JSONB(ARRAY(SELECT JSONB_BUILD_OBJECT('token', tokenAmounts.token,
                                                 'amount', SUM(tokenAmounts.amount)::VARCHAR)
                       FROM (SELECT "Retips"."token", SUM(COALESCE("Retips"."tokenAmount", 0)) AS amount
                             FROM "Retips"
                             WHERE "Retips"."createdAt" BETWEEN NOW() - INTERVAL ? DAY AND NOW()
                               AND "Retips"."token" IS NOT NULL
                             GROUP BY "Retips"."token") AS tokenAmounts
                       WHERE tokenAmounts.amount > 0
                       GROUP BY tokenAmounts.token))) AS "retipTokenAmount";`,
};
