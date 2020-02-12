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
      nonce: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      received_at: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      repaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      amount: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      note: {
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
