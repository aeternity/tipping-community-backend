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
  Comment.addHook('beforeCreate', async (comment) => {
    // eslint-disable-next-line global-require
    const { Profile: ProfileModel } = require('.');
    const profile = await ProfileModel.findOne({ where: { author: comment.author }, raw: true });
    if (!profile) {
      await ProfileModel.create({
        author: comment.author,
        signature: 'automated-profile',
        challenge: 'automated-profile',
      });
    }
  });
  return Comment;
};
