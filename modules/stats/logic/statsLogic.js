const { sequelize, Comment } = require('../../../models');
const CacheLogic = require('../../cache/logic/cacheLogic');

module.exports = class StatsLogic {
  static async fetchStats() {
    const [results] = await sequelize.query('SELECT ROW_TO_JSON(stats.*) as stats FROM stats');
    return results.length ? results[0].stats : null;
  }

  static async fetchUserStats(address) {
    const claimedUrls = await CacheLogic.getOracleClaimedUrls(address);

    const [results] = await sequelize.query('SELECT ROW_TO_JSON(senderstats.*) as senderstats FROM senderstats WHERE sender = ?;',
      { replacements: [address], type: sequelize.QueryTypes.SELECT });

    const [urlStats] = await sequelize.query('SELECT SUM(urlstats.totaltipslength) AS totaltipslength, SUM(urlstats.totalamount::NUMERIC)::VARCHAR AS totalamount FROM urlstats WHERE url IN (?);',
      { replacements: [claimedUrls], type: sequelize.QueryTypes.SELECT });

    const commentCount = await Comment.count({ where: { author: address } });

    return {
      commentCount,
      claimedUrls,
      claimedUrlsLength: claimedUrls.length,
      urlStats,
      ...results ? results.senderstats : {},
    };
  }
};
