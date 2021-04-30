/* eslint-disable max-len */

module.exports = {
  GLOBAL_STATS: 'SELECT stats.* as "stats" FROM stats',
  URL_STATS: 'SELECT urlstats.* as "urlStats" FROM urlstats',
  URL_STATS_BY_URL: 'SELECT urlstats.* as "urlStats" FROM urlstats WHERE url = ?;',
  SUM_URL_STATS_FOR_URLS: 'SELECT SUM(urlstats."totalTipsLength") AS "totalTipsLength", SUM(urlstats."totalAmount"::NUMERIC)::VARCHAR AS "totalAmount" FROM urlstats WHERE url IN (?);',
  SENDER_STATS: 'SELECT ROW_TO_JSON(senderstats.*) as senderstats FROM senderstats WHERE sender = ?;',
};
