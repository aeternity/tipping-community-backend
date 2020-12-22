module.exports = (sequelize, DataTypes) => sequelize.define('Trace', {
  // attributes
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  uuid: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  publicKey: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});
