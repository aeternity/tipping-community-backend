module.exports = (sequelize, DataTypes) => sequelize.define('Tip', {
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
}, {
  timestamps: true,
});
