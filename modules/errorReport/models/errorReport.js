module.exports = (sequelize, DataTypes) => sequelize.define('ErrorReport', {
  // attributes
  appVersion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  browser: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  error: {
    type: DataTypes.JSONB,
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
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  timestamps: true,
});
