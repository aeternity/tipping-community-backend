const CacheLogic = require('../../cache/logic/cacheLogic');
const cache = require('../../cache/utils/cache');

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

  static async wordRegistry(req, res) {
    return res.send(await CacheLogic.getWordRegistryData());
  }

  static async wordSaleDetails(req, res) {
    if (!req.query.address) return res.status(400).send('address query missing');

    return res.send(await CacheLogic.wordSaleDetails(req.query.address));
  }

  static async wordSaleDetailsByToken(req, res) {
    if (!req.query.address) return res.status(400).send('address query missing');

    const data = await CacheLogic.wordSaleDetailsByToken(req.query.address);
    if (!data) return res.status(404).send('no word sale information for address');

    return res.send(data);
  }

  static async wordSaleVotesDetails(req, res) {
    if (!req.query.address) return res.status(400).send('address query missing');

    return res.send(await CacheLogic.wordSaleVotesDetails(req.query.address));
  }
};
