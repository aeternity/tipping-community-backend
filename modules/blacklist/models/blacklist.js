import { BLACKLIST_STATUS } from '../constants/blacklistStates.js';

export default (sequelize, DataTypes) => sequelize.define('BlacklistEntry', {
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
  signature: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  challenge: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});
