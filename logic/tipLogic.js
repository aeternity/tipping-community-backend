const { Tip } = require('../models');

module.exports = class TipLogic {
  static async fetchAllLocalTips () {
    return Tip.findAll({ raw: true });
  }
};
