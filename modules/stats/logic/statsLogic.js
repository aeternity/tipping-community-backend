const { sequelize, Comment } = require('../../../models');
const CacheLogic = require('../../cache/logic/cacheLogic');
const {
  SUM_URL_STATS_FOR_URLS, SENDER_STATS, GLOBAL_STATS, URL_STATS,
} = require('../utils/statsAggregation');

module.exports = class StatsLogic {
  static async fetchStats() {
    const [stats] = await sequelize.query(GLOBAL_STATS);
    const [urlStats] = await sequelize.query(URL_STATS);
    return stats.length ? { ...stats[0], urlStats } : null;
  }

  static async fetchUserStats(address) {
    const claimedUrls = await CacheLogic.getOracleClaimedUrls(address);

    const [results] = await sequelize.query(SENDER_STATS, { replacements: [address], type: sequelize.QueryTypes.SELECT });
    const [urlStats] = await sequelize.query(SUM_URL_STATS_FOR_URLS, { replacements: [claimedUrls], type: sequelize.QueryTypes.SELECT });
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
