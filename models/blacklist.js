module.exports = (sequelize, DataTypes) => {

  return sequelize.define('BlacklistEntry', {
    // attributes
    tipId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    status: {
      type: DataTypes.ENUM({
        values: ['flagged', 'hidden']
      }),
      defaultValue: 'hidden',
      allowNull: false,
    },
    flagger: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
  });
};

