import { CONSENT_STATES } from '../constants/consentStates.js';

export default (sequelize, DataTypes) => sequelize.define('Consent', {
  // attributes
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scope: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM({
      values: Object.values(CONSENT_STATES),
    }),
    allowNull: false,
  },
  signature: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  challenge: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['author', 'scope'],
    },
  ],
  timestamps: true,
});
