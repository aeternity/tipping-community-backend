const { BLACKLIST_STATUS } = require('./enums/blacklist');

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
  flagger: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});
