module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Trace', {
    // attributes
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    publicKey: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    timestamps: true,
  });
};

