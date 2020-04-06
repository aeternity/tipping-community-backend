module.exports = (sequelize, DataTypes) => {
  return sequelize.define('IPFSEntry', {
    // attributes
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
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
