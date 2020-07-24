const Tip = require('./tip');

module.exports = (sequelize, DataTypes) => {
  const Retip = sequelize.define('Retip', {
    // attributes
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  }, {
    timestamps: true,
  });
  Retip.belongsTo(Tip(sequelize, DataTypes), { foreignKey: 'tipId' });
  return Retip;
};
