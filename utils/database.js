const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

const BlacklistEntry = require('../models/blacklist.js');
BlacklistEntry.init(sequelize, Sequelize);

const Comment = require('../models/comment.js');
Comment.init(sequelize, Sequelize);
Comment.hasMany(Comment, { as: 'Children', foreignKey: '_parentCommentId', useJunctionTable: false });

const LinkPreview = require('../models/linkPreview.js');
LinkPreview.init(sequelize, Sequelize);

const Tip = require('../models/tip.js');
Tip.init(sequelize, Sequelize);

sequelize.sync();

module.exports = {
  sequelize,
  BlacklistEntry,
  Comment,
  LinkPreview,
  Tip
};
