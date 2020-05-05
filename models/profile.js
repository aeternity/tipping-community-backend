module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Profile', {
    // attributes
    biography: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    preferredChainName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    signature: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    challenge: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imageSignature: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imageChallenge: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });
};

