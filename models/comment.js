'use strict';
module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    tipId: DataTypes.STRING,
    text: DataTypes.STRING,
    author: DataTypes.STRING,
    hidden: DataTypes.BOOLEAN
  }, {});
  Comment.associate = function(models) {
    // associations can be defined here
  };
  return Comment;
};