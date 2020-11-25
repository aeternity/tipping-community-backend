module.exports = (sequelize, DataTypes) => sequelize.define('ErrorReport', {
  // attributes
  appVersion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  browser: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});
