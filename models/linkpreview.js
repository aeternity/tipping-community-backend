'use strict';
module.exports = (sequelize, DataTypes) => {
  const LinkPreview = sequelize.define('LinkPreview', {
    requestUrl: DataTypes.STRING,
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    image: DataTypes.BOOLEAN,
    responseUrl: DataTypes.STRING,
    lang: DataTypes.STRING,
    querySucceeded: DataTypes.BOOLEAN,
    failReason: DataTypes.STRING
  }, {});
  LinkPreview.associate = function(models) {
    // associations can be defined here
  };
  return LinkPreview;
};