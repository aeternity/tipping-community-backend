const aeternity = require('../utils/aeternity.js');
const AsyncTipGeneratorsLogic = require('./asyncTipGeneratorsLogic');
const cache = require('../utils/cache');

module.exports = class TokenCacheLogic {

  constructor() {
    this.init();
  }

  async init() {
    await aeternity.init();
    await cache.init(aeternity, () => {});
  }
  static async fetchTokenInfos() {
    const fetchData = async () => {
      const tips = await aeternity.getTips();
      return AsyncTipGeneratorsLogic.triggerGetTokenContractIndex(tips);
    };

    return cache.getOrSet(['fetchTokenInfos'], () => fetchData(), cache.shortCacheTime);
  }

  static async deliverTokenInfo(req, res) {
    const tokenInfo = await TokenCacheLogic.fetchTokenInfos();
    res.send(tokenInfo);
  }

  static async indexTokenInfo(req, res) {
    if (!req.body.address) return res.status(400).send("address body attribute missing")

    try {
      await aeternity.getTokenMetaInfoCacheAccounts(req.body.address);
      return res.send("OK");
    } catch (e) {
      return res.status(500).send(e.message)
    }
  }

  static async tokenAccountBalance(req, res) {
    if (!req.query.address) return res.status(400).send("address query missing")

    const tokenBalances = await aeternity.getCacheTokenBalances(req.query.address);
    return res.send(await tokenBalances.reduce(async (promiseAcc, address) => {
      const acc = await promiseAcc;
      acc[address] = await aeternity.getTokenMetaInfoCacheAccounts(address);
      return acc;
    }, Promise.resolve({})));
  }

}
