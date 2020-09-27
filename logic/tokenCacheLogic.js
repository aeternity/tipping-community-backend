const aeternity = require('../utils/aeternity.js');
const cache = require('../utils/cache');
const CacheLogic = require('./cacheLogic');

module.exports = class TokenCacheLogic {
  static async init() {
    await aeternity.init();
    await cache.init(aeternity, () => {});
  }

  static async deliverTokenInfo(req, res) {
    res.send(await CacheLogic.getTokenInfos());
  }

  static async indexTokenInfo(req, res) {
    if (!req.body.address) return res.status(400).send('address body attribute missing');

    try {
      await CacheLogic.getTokenMetaInfo(req.body.address);
      CacheLogic.getTokenInfos();
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

  static async invalidateTokenCache(req, res) {
    await cache.del(['getTokenAccounts', req.params.token]);
    CacheLogic.getTokenAccounts(req.params.token); // just trigger cache update, so follow up requests may have it cached already
    if (res) res.send({ status: 'OK' });
  }

  static async getTokenMetaInfoAccounts(contractAddress) {
    const metaInfo = await CacheLogic.getTokenMetaInfo(contractAddress);

    // Update account balances, just trigger, no need to await
    CacheLogic.getTokenAccounts(contractAddress);

    // add token to registry if not added yet
    const tokenInRegistry = await CacheLogic.getTokenRegistryState().then(state => state.find(([token]) => token === contractAddress));
    if (metaInfo && !tokenInRegistry) await aeternity.addTokenToRegistry(contractAddress);
  }
};
