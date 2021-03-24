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
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM({
      values: Object.values(TIP_TYPES),
    }),
    allowNull: false,
  },
  sender: { type: DataTypes.STRING },
  contractId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tokenAmount: {
    type: DataTypes.NUMERIC,
    allowNull: true,
  },
  amount: {
    type: DataTypes.NUMERIC,
    allowNull: true,
  },
  claimGen: {
    type: DataTypes.NUMERIC,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
});
