const Sentry = require('@sentry/node');
const ipfs = require('../../backup/logic/ipfsLogic');
const cache = require('../../cache/utils/cache');
const models = require('../../../models');
const aeternity = require('../../aeternity/logic/aeternity');
const logger = require('../../../utils/logger')(module);

const HealthLogic = {
  /**
   * Checks for database consistency
   * Its using the ORM to query all tables which errors
   * if fields are not according to the model
   * @returns {Promise<boolean>}
   */
  async checkDBHealth() {
    try {
      await Promise.all(Object.keys(models)
        .filter(key => key.toLowerCase() !== 'sequelize')
        .map(async key => models[key].findOne({ raw: true })));
      return true;
    } catch (e) {
      logger.error(`DB health failed with: ${e.message}`);
      Sentry.captureException(e);
      return false;
    }
  },

  async checkIPFSHealth() {
    try {
      await ipfs.getCoreVitals();
      return true;
    } catch (e) {
      logger.error(`IPFS health failed with: ${e.message}`);
      Sentry.captureException(e);
      return false;
    }
  },

  async checkRedisHealth() {
    try {
      await cache.getOrSet(['redisTest'], async () => 'done');
      return true;
    } catch (e) {
      logger.error(`Redis health failed with: ${e.message}`);
      Sentry.captureException(e);
      return false;
    }
  },

  async checkAEClient() {
    try {
      if (!aeternity.getClient()) await aeternity.init();
      const balance = await aeternity.getBalance();
      const parsed = parseInt(balance, 10);
      // Consider AE healthy if the node is reachable and returns a numeric balance (>= 0)
      return !Number.isNaN(parsed) && parsed >= 0;
    } catch (e) {
      logger.error(`AE health failed with: ${e.message}`);
      Sentry.captureException(e);
      return false;
    }
  },
};

module.exports = HealthLogic;
