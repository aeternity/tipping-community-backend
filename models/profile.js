const Sequelize = require("sequelize");

class Profile extends Sequelize.Model {
  static init (sequelize, DataTypes) {
    super.init({
      // attributes
      biography: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      challenge: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imageSignature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imageChallenge: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    }, {
      sequelize,
      modelName: 'Profile',
      timestamps: true,
    })
  }
}

module.exports = Profile;
