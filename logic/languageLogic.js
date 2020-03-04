const { LinkPreview } = require('../models');
const { Op } = require('sequelize');

module.exports = class Verified {

  static async getChinesePosts (req, res) {
    res.send((await LinkPreview.findAll({
      where: {
        lang: 'zh',
      },
      attributes: ['requestUrl'],
      raw: true,
    })).map(({requestUrl}) => requestUrl));
  }

  static async getNonChinesePosts (req, res) {
    res.send((await LinkPreview.findAll({
      where: {
        lang: {
          [Op.not]: 'zh',
        },
      },
      attributes: ['requestUrl'],
      raw: true,
    })).map(({requestUrl}) => requestUrl));
  }
};
