const { sequelize } = require('../../../models');

module.exports = class StatsLogic {
  static async fetchStats() {
    const [results] = await sequelize.query("SELECT ROW_TO_JSON(stats.*) as stats FROM stats");
    return results.length ? results[0].stats : null;
  }
}
