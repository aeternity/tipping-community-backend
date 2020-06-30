const { IPFS_DB_TYPES } = require('./enums/ipfs')

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('IPFSEntry', {
    // attributes
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM({
        values: IPFS_DB_TYPES
      }),
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });
};
