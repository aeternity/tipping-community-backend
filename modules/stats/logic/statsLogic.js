const { sequelize, Comment } = require('../../../models');
const CacheLogic = require('../../cache/logic/cacheLogic');
const { URL_STATS, SENDER_STATS, GLOBAL_STATS } = require('../utils/statsAggregation');

module.exports = class StatsLogic {
  static async fetchStats() {
    const [results] = await sequelize.query(GLOBAL_STATS);
    return results.length ? results[0].stats : null;
  }

  static async fetchUserStats(address) {
    const claimedUrls = await CacheLogic.getOracleClaimedUrls(address);

    const [results] = await sequelize.query(SENDER_STATS, { replacements: [address], type: sequelize.QueryTypes.SELECT });
    const [urlStats] = await sequelize.query(URL_STATS, { replacements: [claimedUrls], type: sequelize.QueryTypes.SELECT });
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
