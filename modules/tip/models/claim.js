export default (sequelize, DataTypes) =>
  sequelize.define(
    "Claim",
    {
      // attributes
      contractId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      url: {
        type: DataTypes.TEXT,
        primaryKey: true,
        allowNull: false,
      },
      amount: {
        type: DataTypes.NUMERIC,
        allowNull: false,
      },
      claimGen: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      indexes: [
        {
          primaryKey: true,
          fields: ["contractId", "url"],
        },
      ],
    },
  );
