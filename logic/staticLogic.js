const Sequelize = require('sequelize');
const {
  BlacklistEntry, Comment, LinkPreview, Profile,
} = require('../models');
const cache = require('../utils/cache');
const logger = require('../utils/logger')(module);

module.exports = class StaticLogic {
  static async getStatsPerModel(Model) {
    return {
      today: await Model.count({
        where: {
          createdAt: {
            [Sequelize.Op.gt]: new Date().setHours(0, 0, 0, 0),
          },
        },
      }),
      yesterday: await Model.count({
        where: {
          createdAt: {
            [Sequelize.Op.gt]: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0),
            [Sequelize.Op.lt]: new Date().setHours(0, 0, 0, 0),
          },
        },
      }),
      last7Days: await Model.count({
        where: { createdAt: { [Sequelize.Op.gt]: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) } },
      }),
      last30Days: await Model.count({
        where: { createdAt: { [Sequelize.Op.gt]: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)) } },
      }),
      total: await Model.count(),
    };
  }

  static async getStats() {
    return cache.getOrSet(
      ['StaticLogic.getStats'],
      async () => ({
        comments: await StaticLogic.getStatsPerModel(Comment),
        linkPreviews: await StaticLogic.getStatsPerModel(LinkPreview),
        profiles: await StaticLogic.getStatsPerModel(Profile),
        blacklist: await StaticLogic.getStatsPerModel(BlacklistEntry),
      }),
    );
  }

  static async deliverStats(req, res) {
    try {
      return res.send(await StaticLogic.getStats());
    } catch (err) {
      logger.error(err);
      return res.status(500).send(err.message);
    }
  }

  static async getGrayList(req, res) {
    res.send([
      'facebook.com',
      'weibo.com',
      'pinterest.com',
      'vk.com',
      'quora.com',
      'spotify.com',
      'linkedin.com',
    ]);
  }
};
