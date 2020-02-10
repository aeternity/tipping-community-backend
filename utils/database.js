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

sequelize.sync();

module.exports = {
  sequelize,
  BlacklistEntry,
  Comment,
};
