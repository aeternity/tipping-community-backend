module.exports = (sequelize, DataTypes) => sequelize.define('Retip', {
  // attributes
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  unclaimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sender: {type: DataTypes.STRING},
}, {
  timestamps: true,
});
