const {LinkPreview} = require('../models');
const {Op} = require('sequelize');

module.exports = class Verified {

  static async getChinesePosts() {
    return await LinkPreview.findAll({
      where: {
        lang: 'zh',
      },
      attributes: ['requestUrl'],
      raw: true,
    })
  }

  static async getNonChinesePosts() {
    return await LinkPreview.findAll({
      where: {
        lang: {
          [Op.not]: 'zh',
        },
      },
      attributes: ['requestUrl'],
      raw: true,
    })
  }
};
