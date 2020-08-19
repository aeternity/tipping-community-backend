const { TIP_TYPES } = require('./enums/tip');
const cache = require('../utils/cache');

module.exports = (sequelize, DataTypes) => {
  const Tip = sequelize.define('Tip', {
    // attributes
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM({
        values: Object.values(TIP_TYPES),
      }),
      defaultValue: TIP_TYPES.AE_TIP,
      allowNull: false,
    },
    unclaimed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    timestamps: true,
  });
  Tip.addHook('afterCreate', () => cache.del(['fetchStats']));
  Tip.addHook('afterUpdate', () => cache.del(['fetchStats']));
  return Tip;
};
