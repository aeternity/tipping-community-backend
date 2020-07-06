module.exports = (sequelize, DataTypes) => sequelize.define('LinkPreview', {
  // attributes
  requestUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  responseUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lang: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  querySucceeded: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  failReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});
