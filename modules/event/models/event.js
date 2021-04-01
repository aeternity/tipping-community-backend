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
    type: DataTypes.NUMBER,
    allowNull: false,
  },
  addresses: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  },
  time: {
    type: DataTypes.NUMBER,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
}, {
  indexes: [
    {
      fields: ['name', 'height', 'time'],
    },
  ],
  timestamps: true,
});
