export default (sequelize, DataTypes) => sequelize.define('ChainName', {
  // attributes
  publicKey: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});
