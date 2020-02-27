const Sequelize = require('sequelize');

class Comment extends Sequelize.Model {
  static init (sequelize, DataTypes) {
    super.init({
      // attributes
      tipId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      text: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      hidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    }, {
      sequelize,
      modelName: 'Comment',
      timestamps: true,
    });
  }
}


module.exports = Comment;
