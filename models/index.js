const path = require('path');
const Sequelize = require('sequelize');
require('sequelize-hierarchy')(Sequelize);
const glob = require('glob');
const config = require('../config/config.js');
const applyRelations = require('./relations')

const basename = path.basename(__filename);
const db = {};

const sequelize = new Sequelize(config.development);
glob.sync('modules/**/models/*.js')
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach(file => {
    const model = sequelize.import(path.join(__dirname, '..', file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

applyRelations(db, sequelize, Sequelize.Op);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
