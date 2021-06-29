const ipfs = require('../../backup/logic/ipfsLogic');
const cache = require('../../cache/utils/cache');
const models = require('../../../models');
const aeternity = require('../../aeternity/logic/aeternity');

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
      return false;
    }
  },

  async checkIPFSHealth() {
    try {
      await ipfs.getCoreVitals();
      return true;
    } catch (e) {
      return false;
    }
  },

  async checkRedisHealth() {
    try {
      await cache.getOrSet(['redisTest'], async () => 'done');
      return true;
    } catch (e) {
      return false;
    }
  },

  async checkAEClient() {
    try {
      const balance = await aeternity.getBalance();
      return parseInt(balance, 10) > 0;
    } catch (e) {
      return false;
    }
  },

  async answerHealthRequest(req, res) {
    const dbHealth = await HealthLogic.checkDBHealth();
    const ipfsHealth = await HealthLogic.checkIPFSHealth();
    const redisHealth = await HealthLogic.checkRedisHealth();
    const aeHealth = await HealthLogic.checkAEClient();
    const allHealthy = dbHealth && ipfsHealth && redisHealth && aeHealth;
    res.status(allHealthy ? 200 : 500).send({
      dbHealth, ipfsHealth, redisHealth, aeHealth, allHealthy,
    });
  },
};

module.exports = HealthLogic;
