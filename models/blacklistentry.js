'use strict';
module.exports = (sequelize, DataTypes) => {
  const BlacklistEntry = sequelize.define('BlacklistEntry', {
    tipId: DataTypes.STRING
  }, {});
  BlacklistEntry.associate = function(models) {
    // associations can be defined here
  };
  return BlacklistEntry;
};