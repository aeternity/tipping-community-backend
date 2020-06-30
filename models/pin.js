const { PINNED_CONTENT_DB_TYPES } = require('./enums/pin')

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Pin', {
    // attributes
    entryId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM({
        values: PINNED_CONTENT_DB_TYPES
      }),
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    signature: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    challenge: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['entryId', 'type', 'author']
      }
    ],
    timestamps: true,
  });
};
