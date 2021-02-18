const { TIP_TYPES } = require('../constants/tipTypes');

module.exports = (sequelize, DataTypes) => sequelize.define('Tip', {
  // attributes
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  topics: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  },
  media: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM({
      values: Object.values(TIP_TYPES),
    }),
    defaultValue: TIP_TYPES.AE_TIP,
    allowNull: false,
  },
  sender: { type: DataTypes.STRING },
  unclaimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});
