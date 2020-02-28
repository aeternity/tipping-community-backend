const Sequelize = require('sequelize');

class Tip extends Sequelize.Model {
  static init (sequelize, DataTypes) {
    super.init({
      // attributes
      tipId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    }, {
      sequelize,
      modelName: 'Tip',
      timestamps: true,
    });
  }
}

module.exports = Tip;
