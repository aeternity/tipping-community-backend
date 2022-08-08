/**
 * Config file used only by sequelize
 */
const logger = require('../utils/logger')(module);

module.exports = {
  development: {
    dialect: 'postgres',
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'superhero',
    ssl: process.env.POSTGRES_SSL || false,
    logging: msg => logger.debug(msg),
  },
};
