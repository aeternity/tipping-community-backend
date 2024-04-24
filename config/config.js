import loggerFactory from "../utils/logger.js";
/**
 * Config file used only by sequelize
 */
const logger = loggerFactory(import.meta.url);
export const development = {
    dialect: 'postgres',
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'superhero',
    ssl: process.env.POSTGRES_SSL || false,
    logging: msg => logger.debug(msg),
};
export default {
    development
};
