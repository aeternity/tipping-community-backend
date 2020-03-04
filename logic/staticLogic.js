const { BlacklistEntry, Comment, LinkPreview, Profile, Tip } = require('../models');
const Sequelize = require('sequelize');

module.exports = class StaticLogic {

  static async getStatsPerModel (Model) {
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

  static async getStats (req, res) {
    try {
      res.send({
        comments: await StaticLogic.getStatsPerModel(Comment),
        linkPreviews: await StaticLogic.getStatsPerModel(LinkPreview),
        profiles: await StaticLogic.getStatsPerModel(Profile),
        tips: await StaticLogic.getStatsPerModel(Tip),
        blacklist: await StaticLogic.getStatsPerModel(BlacklistEntry),
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send(err.message);
    }
  }

  static async getContract (req, res) {
    res.send({ contractFile: process.env.CONTRACT_FILE, contractAddress: process.env.CONTRACT_ADDRESS });
  }
};
