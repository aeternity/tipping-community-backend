const ipfs = require('../utils/ipfs');
const cache = require('../utils/cache');
const models = require('../models');
const aeternity = require('../utils/aeternity');

module.exports = class HealthLogic {
  /**
   * Checks for database consistency
   * Its using the ORM to query all tables which errors
   * if fields are not according to the model
   * @returns {Promise<boolean>}
   */
  static async checkDBHealth() {
    try {
      await Promise.all(Object.keys(models)
        .filter(key => key.toLowerCase() !== 'sequelize')
        .map(async key => models[key].findAll({ raw: true })));
      return true;
    } catch (e) {
      return false;
    }
  }

  static async checkIPFSHealth() {
    try {
      await ipfs.node.id();
      await ipfs.node.version();
      return true;
    } catch (e) {
      return false;
    }
  }

  static async checkRedisHealth() {
    try {
      await cache.getOrSet(['redisTest'], async () => 'done');
      return true;
    } catch (e) {
      return false;
    }
  }

  static async checkAEClient() {
    try {
      const address = await aeternity.client.address();
      const balance = await aeternity.client.getBalance(address);
      return process.env.NODE_ENV === 'test' ? true : parseInt(balance, 10) > 0;
    } catch (e) {
      return false;
    }
  }

  static async answerHealthRequest(req, res) {
    const dbHealth = await HealthLogic.checkDBHealth();
    const ipfsHealth = await HealthLogic.checkIPFSHealth();
    const redisHealth = await HealthLogic.checkRedisHealth();
    const aeHealth = await HealthLogic.checkAEClient();
    const allHealthy = dbHealth && ipfsHealth && redisHealth && aeHealth;
    res.status(allHealthy ? 200 : 500).send({
      dbHealth, ipfsHealth, redisHealth, aeHealth, allHealthy,
    });
  }
};
