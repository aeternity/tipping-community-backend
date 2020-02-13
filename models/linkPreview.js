const Sequelize = require('sequelize');

class LinkPreview extends Sequelize.Model {
  static init (sequelize, DataTypes) {
    super.init({
      // attributes
      requestUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      responseUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lang: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      querySucceeded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      failReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    }, {
      sequelize,
      modelName: 'LinkPreview',
      timestamps: true,
    });
  }
}

module.exports = LinkPreview;
