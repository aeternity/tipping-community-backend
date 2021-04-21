/* eslint-disable max-len */

module.exports = {
  GLOBAL_STATS: 'SELECT ROW_TO_JSON(stats.*) as stats FROM stats',
  URL_STATS: 'SELECT SUM(urlstats.totaltipslength) AS totaltipslength, SUM(urlstats.totalamount::NUMERIC)::VARCHAR AS totalamount FROM urlstats WHERE url IN (?);',
  SENDER_STATS: 'SELECT ROW_TO_JSON(senderstats.*) as senderstats FROM senderstats WHERE sender = ?;',
};
