export default (sequelize, DataTypes) =>
  sequelize.define(
    "Retip",
    {
      // attributes
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      tipId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sender: { type: DataTypes.STRING },
      token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tokenAmount: {
        type: DataTypes.NUMERIC,
        allowNull: true,
      },
      amount: {
        type: DataTypes.NUMERIC,
        allowNull: true,
      },
      claimGen: {
        type: DataTypes.NUMERIC,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    },
  );
