module.exports = (sequelize, DataTypes) => {
  return sequelize.define('BlacklistEntry', {
    // attributes
    tipId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    timestamps: true,
  });
};

