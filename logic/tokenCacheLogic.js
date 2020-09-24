const aeternity = require('../utils/aeternity.js');
const AsyncTipGeneratorsLogic = require('./asyncTipGeneratorsLogic');
const cache = require('../utils/cache');

module.exports = class TokenCacheLogic {
  static async init() {
    await aeternity.init();
    await cache.init(aeternity, () => {});
  }

  static async fetchTokenInfos() {
    const fetchData = async () => {
      const tips = await CacheLogic.getTips();
      return AsyncTipGeneratorsLogic.triggerGetTokenContractIndex(tips);
    };

    return cache.getOrSet(['fetchTokenInfos'], () => fetchData(), cache.shortCacheTime);
  }

  static async deliverTokenInfo(req, res) {
    const tokenInfo = await TokenCacheLogic.fetchTokenInfos();
    res.send(tokenInfo);
  }

  static async indexTokenInfo(req, res) {
    if (!req.body.address) return res.status(400).send('address body attribute missing');

    try {
      await aeternity.getTokenMetaInfoCacheAccounts(req.body.address);
      TokenCacheLogic.fetchTokenInfos();
      return res.send('OK');
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  static async tokenAccountBalance(req, res) {
    if (!req.query.address) return res.status(400).send('address query missing');

    const tokenBalances = await aeternity.getCacheTokenBalances(req.query.address);
    return res.send(await tokenBalances.reduce(async (promiseAcc, address) => {
      const acc = await promiseAcc;
      acc[address] = await aeternity.getTokenMetaInfoCacheAccounts(address);
      return acc;
    }, Promise.resolve({})));
  }

  static async invalidateTokenCache(req, res) {
    await cache.del(['getCacheTokenAccounts', req.params.token]);
    aeternity.getCacheTokenAccounts(req.params.token); // just trigger cache update, so follow up requests may have it cached already
    if (res) res.send({ status: 'OK' });
  }
};
