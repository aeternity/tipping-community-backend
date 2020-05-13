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
    }
  }, {
    timestamps: true,
  });
};

