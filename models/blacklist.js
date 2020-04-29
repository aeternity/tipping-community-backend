module.exports = (sequelize, DataTypes) => {
  return sequelize.define('BlacklistEntry', {
    // attributes
    tipId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    timestamps: true,
  });
};

