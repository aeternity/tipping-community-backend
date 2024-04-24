import models from "../../../models/index.js";
import CacheLogic from "../../cache/logic/cacheLogic.js";
import { SUM_URL_STATS_FOR_URLS, SENDER_STATS, GLOBAL_STATS, URL_STATS, URL_STATS_BY_URL, MARKETING_STATS } from "../utils/statsAggregation.js";

const { sequelize, Comment } = models;
const StatsLogic = {
  async urlStats(url) {
    const [urlStats] = await sequelize.query(URL_STATS_BY_URL, { replacements: [url], type: sequelize.QueryTypes.SELECT });
    return urlStats;
  },
  async fetchStats() {
    const [stats] = await sequelize.query(GLOBAL_STATS);
    const [urlStats] = await sequelize.query(URL_STATS);
    return stats.length ? { ...stats[0], urlStats } : null;
  },
  async fetchUserStats(address) {
    const claimedUrls = await CacheLogic.getOracleClaimedUrls(address);
    const [results] = await sequelize.query(SENDER_STATS, { replacements: [address], type: sequelize.QueryTypes.SELECT });
    const [urlStats] = claimedUrls.length ? await sequelize.query(SUM_URL_STATS_FOR_URLS, { replacements: [claimedUrls], type: sequelize.QueryTypes.SELECT }) : [{ totalAmount: "0", totalTipsLength: "0" }];
    const commentCount = await Comment.count({ where: { author: address } });
    return {
      commentCount,
      claimedUrls,
      claimedUrlsLength: claimedUrls.length,
      urlStats,
      ...(results ? results.senderstats : {}),
    };
  },
  async fetchMarketingStats() {
    const getForDays = async (days) => {
      const [daysStats] = await sequelize.query(MARKETING_STATS, {
        replacements: Array(12).fill(String(days)),
        type: sequelize.QueryTypes.SELECT,
      });
      return daysStats;
    };
    return {
      "1day": await getForDays(1),
      "7days": await getForDays(7),
      "30days": await getForDays(30),
    };
  },
};
export default StatsLogic;
