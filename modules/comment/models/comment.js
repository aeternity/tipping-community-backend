import Profile from '../../profile/models/profile.js';
import models from '../../../models/index.js';

export default (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    // attributes
    tipId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
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
      type: DataTypes.TEXT,
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
  Comment.addHook('beforeCreate', async comment => {
    // eslint-disable-next-line global-require
    const { Profile: ProfileModel } = models;
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
