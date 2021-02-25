module.exports = (sequelize, DataTypes) => sequelize.define('LinkPreview', {
  // attributes
  requestUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  responseUrl: {
    type: DataTypes.TEXT,
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
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});
