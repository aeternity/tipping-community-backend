const BigNumber = require('bignumber.js');
const AsyncLock = require('async-lock');
const axios = require('axios');
const aeternity = require('../../aeternity/logic/aeternity');
const CommentLogic = require('../../comment/logic/commentLogic');
const cache = require('../utils/cache');
const queue = require('../../queue/logic/queueLogic');

const lock = new AsyncLock();
const { getTipTopics } = require('../../aeternity/utils/tipTopicUtil');
const Util = require('../../aeternity/utils/util');
const MdwLogic = require('../../aeternity/logic/mdwLogic');
const { MESSAGES, MESSAGE_QUEUES } = require('../../queue/constants/queue');

const logger = require('../../../utils/logger')(module);

module.exports = class CacheLogic {
  static async init() {
    // INIT ONCE
    await CacheLogic.fetchStats();

    const keepHotFunction = async () => {
      await CacheLogic.getTips();
      await CacheLogic.getAllTips(true); // only keep the blacklisted cache hot
      await CacheLogic.fetchChainNames();
      await CacheLogic.fetchPrice();
      await CacheLogic.getOracleState();
      await CacheLogic.findContractEvents();
      await CacheLogic.getTokenInfos();
    };

    setTimeout(() => {
      cache.setKeepHot(keepHotFunction);
    }, 5000);
  }

  static async findContractEvents() {
    const fetchContractEvents = async () => {
      const height = await aeternity.client.height();
      const contractTransactions = await MdwLogic.middlewareContractTransactions(height);
      return contractTransactions.asyncMap(tx => aeternity.decodeTransactionEvents(tx));
    };

    return cache.getOrSet(['contractEvents'], async () => fetchContractEvents().catch(logger.error), cache.shortCacheTime, false);
  }

  static async fetchPrice() {
    return cache.getOrSet(
      ['fetchPrice'],
      async () => axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,cny')
        .then(res => res.data).catch(logger.error),
      cache.longCacheTime,
    );
  }

  static async getTips() {
    return cache.getOrSet(['getTips'], async () => {
      const tips = await aeternity.fetchTips();
      // Renew Stats
      await cache.del(['fetchStats']);

      await queue.sendMessage(MESSAGE_QUEUES.CACHE, MESSAGES.CACHE.EVENTS.RENEWED_TIPS);

      return tips;
    }, cache.shortCacheTime);
  }

  static async triggerGetTokenContractIndex(tips) {
    return lock.acquire('CacheLogic.triggerTokenContractIndex', async () => {
      const tokenContracts = tips.filter(t => t.token).map(t => t.token);
      const tokenRegistryContracts = await CacheLogic.getTokenRegistryState()
        .then(state => state.map(([token]) => token));

      // can be optimized at a later point in time with general refactoring
      return [...new Set(tokenContracts.concat(tokenRegistryContracts))]
        .reduce(async (promiseAcc, address) => {
          const acc = await promiseAcc;

          // Trigger balance updates
          CacheLogic.getTokenAccounts(address);

          acc[address] = await CacheLogic.getTokenMetaInfo(address);
          return acc;
        }, Promise.resolve({}));
    });
  }

  static async getOracleState() {
    return cache.getOrSet(['oracleState'], () => aeternity.fetchOracleState(), cache.shortCacheTime);
  }

  static async fetchChainNames() {
    return cache.getOrSet(['fetchChainNames'], async () => MdwLogic.getChainNames(), cache.shortCacheTime);
  }

  static async fetchTokenInfos() {
    const tips = await CacheLogic.getTips();
    return CacheLogic.triggerGetTokenContractIndex(tips);
  }

  static async getTokenInfos() {
    return cache.getOrSet(['getTokenInfos'], () => CacheLogic.fetchTokenInfos(), cache.shortCacheTime);
  }

  static async getTokenRegistryState() {
    return cache.getOrSet(['getTokenRegistryState'], () => aeternity.fetchTokenRegistryState(), cache.shortCacheTime);
  }

  static async getTokenBalances(account) {
    const cacheKeys = ['getTokenAccounts.fetchBalances', account];
    const hasBalanceTokens = await cache.get(cacheKeys);
    return hasBalanceTokens || [];
  }

  static async getTokenAccounts(token) {
    return cache.getOrSet(['getTokenAccounts', token], async () => {
      const balances = await aeternity.fetchTokenAccountBalances(token);
      await balances.asyncMap(async ([account]) => {
        const cacheKeys = ['getTokenAccounts.fetchBalances', account];
        const hasBalanceTokens = await cache.get(cacheKeys);
        const updatedBalanceTokens = hasBalanceTokens ? hasBalanceTokens.concat([token]) : [token];
        await cache.set(cacheKeys, [...new Set(updatedBalanceTokens)]);
      });

      return true; // redis can only set cache for defined values, as we just want to cache that we have fetched tokens, just cache true
    }, cache.longCacheTime);
  }

  static async getTokenMetaInfo(contractAddress) {
    return cache.getOrSet(['getTokenMetaInfo', contractAddress], async () => {
      const tokenInRegistry = await CacheLogic.getTokenRegistryState().then(state => state.find(([token]) => token === contractAddress));
      const metaInfo = await aeternity.fetchTokenMetaInfo(contractAddress);

      // add token to registry if its not already there
      if (metaInfo && !tokenInRegistry) {
        await aeternity.addTokenToRegistry(contractAddress);
        await cache.del(['getTokenRegistryState']);
      }
      return metaInfo;
    });
  }

  static async invalidateTipsCache() {
    await cache.del(['getTips']);
    await cache.del(['CacheLogic.getAllTips', 'blacklisted']);
    await cache.del(['CacheLogic.getAllTips', 'all']);
  }

  static async invalidateOracle() {
    await cache.del(['oracleState']);
  }

  static async invalidateContractEvents() {
    await cache.del(['contractEvents']);
  }

  static async invalidateTokenCache(tokenContractAddress) {
    await cache.del(['getTokenAccounts', tokenContractAddress]);
  }

  static async deliverContractEvents(req, res) {
    let contractEvents = await CacheLogic.findContractEvents();
    if (req.query.address) contractEvents = contractEvents.filter(e => e.address === req.query.address);
    if (req.query.event) contractEvents = contractEvents.filter(e => e.event === req.query.event);
    contractEvents.sort((a, b) => b.time - a.time || b.nonce - a.nonce);
    if (req.query.limit) contractEvents = contractEvents.slice(0, parseInt(req.query.limit, 10));
    res.send(contractEvents);
  }

  static async deliverPrice(req, res) {
    res.send(await CacheLogic.fetchPrice());
  }

  static async deliverChainNames(req, res) {
    res.send(await CacheLogic.fetchChainNames());
  }

  static async deliverUserStats(req, res) {
    const oracleState = await CacheLogic.getOracleState();
    const allTips = await CacheLogic.getTips();
    const userTips = allTips.filter(tip => tip.sender === req.query.address);

    const userReTips = allTips.flatMap(tip => tip.retips.filter(retip => retip.sender === req.query.address));
    const totalTipAmount = userTips
      .reduce((acc, tip) => acc.plus(tip.amount), new BigNumber(0))
      .plus(userReTips.reduce((acc, tip) => acc.plus(tip.amount), new BigNumber(0))).toFixed();

    const claimedUrls = oracleState.success_claimed_urls
      ? oracleState.success_claimed_urls
        .filter(([, data]) => data.success && data.account === req.query.address).map(([url]) => url)
      : [];

    const unclaimedAmount = allTips
      .reduce((acc, tip) => (claimedUrls.includes(tip.url)
        ? acc.plus(tip.total_unclaimed_amount)
        : acc),
      new BigNumber(0));

    const claimedAmount = allTips
      .reduce((acc, tip) => (claimedUrls.includes(tip.url)
        ? acc.plus(tip.total_claimed_amount)
        : acc),
      new BigNumber(0));

    const stats = {
      tipsLength: userTips.length,
      retipsLength: userReTips.length,
      claimedUrlsLength: claimedUrls.length,

      totalTipAmount,
      unclaimedAmount,
      claimedAmount,
      totalTipAmountAe: Util.atomsToAe(totalTipAmount).toFixed(),
      unclaimedAmountAe: Util.atomsToAe(unclaimedAmount).toFixed(),
      claimedAmountAe: Util.atomsToAe(claimedAmount).toFixed(),

      userComments: await CommentLogic.fetchCommentCountForAddress(req.query.address),
    };

    res.send(stats);
  }

  static async fetchStats() {
    return cache.getOrSet(['fetchStats'], async () => {
      const tips = await CacheLogic.getTips();

      const groupedByUrl = Util.groupBy(tips, 'url');
      const statsByUrl = Object.keys(groupedByUrl).map(url => ({
        url,
        ...CacheLogic.statsForTips(groupedByUrl[url]),
      }));

      return {
        ...CacheLogic.statsForTips(tips),
        by_url: statsByUrl,
      };
    }, cache.longCacheTime);
  }

  static async deliverStats(req, res) {
    res.send(await CacheLogic.fetchStats());
  }

  static statsForTips(tips) {
    const senders = [...new Set(tips
      .reduce((acc, tip) => acc
        .concat([tip.sender, ...tip.retips.map(retip => retip.sender)]), []))];

    const retipsLength = tips.reduce((acc, tip) => acc + tip.retips.length, 0);

    const totalAmount = tips.reduce((acc, tip) => acc.plus(tip.total_amount), new BigNumber('0')).toFixed();
    const totalUnclaimedAmount = tips.reduce((acc, tip) => acc.plus(tip.total_unclaimed_amount), new BigNumber('0')).toFixed();
    const totalClaimedAmount = tips.reduce((acc, tip) => acc.plus(tip.total_claimed_amount), new BigNumber('0')).toFixed();

    const tokenTotalAmount = Object.entries(tips.reduce((acc, tip) => {
      tip.token_total_amount.forEach(t => {
        acc[t.token] = acc[t.token]
          ? new BigNumber(acc[t.token]).plus(t.amount).toFixed()
          : new BigNumber(t.amount).toFixed();
      });
      return acc;
    }, {})).map(([token, amount]) => ({ token, amount }));

    const tokenTotalUnclaimedAmount = Object.entries(tips.reduce((acc, tip) => {
      tip.token_total_unclaimed_amount.forEach(t => {
        acc[t.token] = acc[t.token]
          ? new BigNumber(acc[t.token]).plus(t.amount).toFixed()
          : new BigNumber(t.amount).toFixed();
      });
      return acc;
    }, {})).map(([token, amount]) => ({ token, amount }));

    return {
      tips_length: tips.length,
      retips_length: retipsLength,
      total_tips_length: tips.length + retipsLength,

      total_amount: totalAmount,
      total_unclaimed_amount: totalUnclaimedAmount,
      total_claimed_amount: totalClaimedAmount,

      total_amount_ae: Util.atomsToAe(totalAmount).toFixed(),
      total_unclaimed_amount_ae: Util.atomsToAe(totalUnclaimedAmount).toFixed(),
      total_claimed_amount_ae: Util.atomsToAe(totalClaimedAmount).toFixed(),

      token_total_amount: tokenTotalAmount,
      token_total_unclaimed_amount: tokenTotalUnclaimedAmount,

      senders,
      senders_length: senders.length,
    };
  }

  static async deliverOracleState(req, res) {
    res.send(await CacheLogic.getOracleState());
  }

  static async deliverTipTopics(req, res) {
    const tips = await CacheLogic.getTips();
    res.send(getTipTopics(tips));
  }
};
