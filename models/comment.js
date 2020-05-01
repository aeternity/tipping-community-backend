const Profile = require('./profile');

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    // attributes
    tipId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    signature: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    challenge: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      hierarchy: true,
    },
  }, {
    timestamps: true,
  });
  Comment.belongsTo(Profile(sequelize, DataTypes), { foreignKey: 'author' });
  Comment.addHook('beforeCreate', async (comment, options) => {
    const { Profile } = require('../models');
    const profile = await Profile.findOne({ where: { author: comment.author }, raw: true });
    if (!profile) await Profile.create({
      author: comment.author,
      signature: 'automated-profile',
      challenge: 'automated-profile',
    });
  });
  return Comment;
};
