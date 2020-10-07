const CacheLogic = require('./cacheLogic');
const cache = require('../utils/cache');

module.exports = class TokenCacheLogic {
  static async deliverTokenInfo(req, res) {
    res.send(await CacheLogic.getTokenInfos());
  }

  static async indexTokenInfo(req, res) {
    if (!req.body.address) return res.status(400).send('address body attribute missing');

    try {
      await CacheLogic.getTokenMetaInfo(req.body.address);
      await cache.del(['getTokenInfos']);
      await CacheLogic.getTokenInfos();
      return res.send('OK');
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  static async tokenAccountBalance(req, res) {
    if (!req.query.address) return res.status(400).send('address query missing');

    const tokenBalances = await CacheLogic.getTokenBalances(req.query.address);
    return res.send(await tokenBalances.reduce(async (promiseAcc, address) => {
      const acc = await promiseAcc;
      acc[address] = await CacheLogic.getTokenMetaInfo(address);
      return acc;
    }, Promise.resolve({})));
  }
};
