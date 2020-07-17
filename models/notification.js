const { NOTIFICATION_TYPES, NOTIFICATION_STATES, ENTITY_TYPES } = require('./enums/notification');

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
}, {
  timestamps: true,
});
