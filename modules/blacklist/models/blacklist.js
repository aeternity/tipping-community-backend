const { BLACKLIST_STATUS } = require('../constants/blacklistStates');

module.exports = (sequelize, DataTypes) => sequelize.define('BlacklistEntry', {
  // attributes
  tipId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM({
      values: Object.values(BLACKLIST_STATUS),
    }),
    defaultValue: BLACKLIST_STATUS.HIDDEN,
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});
