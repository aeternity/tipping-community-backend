const Sequelize = require("sequelize");

class BlacklistEntry extends Sequelize.Model {
  static init(sequelize, DataTypes) {
    super.init({
      // attributes
      tipId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    }, {
      sequelize,
      modelName: 'BlacklistEntry',
      timestamps: true,
    })
  }
}

module.exports = BlacklistEntry;
