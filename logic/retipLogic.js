const { Retip } = require('../models');

module.exports = class RetipLogic {
  static async fetchAllLocalRetips() {
    return Retip.findAll({ raw: true });
  }

  static async bulkCreate(tips) {
    return Retip.bulkCreate(tips, { raw: true });
  }
};
