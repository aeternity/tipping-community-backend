export default (sequelize, DataTypes) =>
  sequelize.define(
    "Profile",
    {
      // attributes
      biography: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      preferredChainName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      referrer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      coverImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      challenge: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      imageSignature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imageChallenge: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    },
  );
