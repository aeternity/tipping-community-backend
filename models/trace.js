module.exports = (sequelize, DataTypes) => sequelize.define('Trace', {
  // attributes
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uuid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  publicKey: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});
