const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

const BlacklistEntry = require('../models/blacklist.js');
BlacklistEntry.init(sequelize, Sequelize);
sequelize.sync();


module.exports = {
  sequelize,
  BlacklistEntry
};
