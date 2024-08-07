const {
  NOTIFICATION_TYPES, NOTIFICATION_STATES, ENTITY_TYPES, SOURCE_TYPES,
} = require('../constants/notification');

module.exports = (sequelize, DataTypes) => sequelize.define('Notification', {
  // attributes
  type: {
    type: DataTypes.ENUM({
      values: Object.values(NOTIFICATION_TYPES),
    }),
    allowNull: false,
  },
  receiver: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sender: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM({
      values: Object.values(NOTIFICATION_STATES),
    }),
    allowNull: false,
    defaultValue: NOTIFICATION_STATES.CREATED,
  },
  entityType: {
    type: DataTypes.ENUM({
      values: Object.values(ENTITY_TYPES),
    }),
    allowNull: true,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sourceType: {
    type: DataTypes.ENUM({
      values: Object.values(SOURCE_TYPES),
    }),
    allowNull: true,
  },
  sourceId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['type', 'entityId', 'entityType', 'receiver', 'sourceType', 'sourceId'],
    },
    {
      unique: true,
      fields: ['type', 'entityId', 'entityType', 'receiver'],
      where: { // seems not to be applied in the generated SQL query
        sourceType: null,
        sourceId: null,
      },
    },
  ],
  timestamps: true,
});
