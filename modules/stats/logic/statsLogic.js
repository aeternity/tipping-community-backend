const { sequelize } = require('../../../models');

module.exports = class StatsLogic {
  static async fetchStats() {
    const [results] = await sequelize.query("SELECT ROW_TO_JSON(stats.*) as stats FROM stats");
    return results.length ? results[0].stats : null;
  }

  static async fetchUserStats(address) {
    const [results] = await sequelize.query('SELECT ROW_TO_JSON(senderstats.*) as senderstats FROM senderstats WHERE sender = ?',
      { replacements: [address], type: sequelize.QueryTypes.SELECT }
    )

    return results ? results.senderstats : null;
  }
}
