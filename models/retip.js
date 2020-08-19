const Tip = require('./tip');
const cache = require('../utils/cache');

module.exports = (sequelize, DataTypes) => {
  const Retip = sequelize.define('Retip', {
    // attributes
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    unclaimed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    timestamps: true,
  });
  Retip.belongsTo(Tip(sequelize, DataTypes), { foreignKey: 'tipId' });
  Retip.addHook('beforeCreate', async () => { await cache.del(['fetchStats']); });
  Retip.addHook('beforeUpdate', async () => { await cache.del(['fetchStats']); });
  return Retip;
};
