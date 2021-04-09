const { EVENT_TYPES } = require('../constants/eventTypes');

module.exports = (sequelize, DataTypes) => sequelize.define('Event', {
  // attributes
  name: {
    type: DataTypes.ENUM({
      values: Object.values(EVENT_TYPES),
    }),
    allowNull: false,
  },
  hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contract: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  addresses: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  amount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nonce: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  time: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
}, {
  indexes: [
    {
      fields: ['name', 'url', 'height', 'time'],
    },
  ],
  timestamps: true,
});
