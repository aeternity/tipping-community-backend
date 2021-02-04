const BigNumber = require('bignumber.js');
const AsyncLock = require('async-lock');
const axios = require('axios');
const requireESM = require('esm')(module);
// use to handle es6 import/export
const { decodeEvents, SOPHIA_TYPES } = requireESM('@aeternity/aepp-sdk/es/contract/aci/transformation');
const aeternity = require('../../aeternity/logic/aeternity');
const CommentLogic = require('../../comment/logic/commentLogic');
const cache = require('../utils/cache');
const queueLogic = require('../../queue/logic/queueLogic');

const lock = new AsyncLock();
const { getTipTopics } = require('../../aeternity/utils/tipTopicUtil');
const Util = require('../../aeternity/utils/util');
const MdwLogic = require('../../aeternity/logic/mdwLogic');
const { MESSAGES, MESSAGE_QUEUES } = require('../../queue/constants/queue');

const logger = require('../../../utils/logger')(module);

module.exports = class CacheLogic {
  static async init() {
    // INIT ONCE

    const keepHotFunction = async () => {
      await CacheLogic.getTips();
      await CacheLogic.fetchChainNames();
      await CacheLogic.fetchPrice();
      await CacheLogic.getOracleState();
      await CacheLogic.findContractEvents();
      await CacheLogic.getTokenInfos();
      if (process.env.WORD_REGISTRY_CONTRACT) {
        await CacheLogic.refreshWordAndVoteData(); // keeps hot even if undefined is passed as argument
      }
    };

    setTimeout(async () => {
      cache.setKeepHot(keepHotFunction);
      await CacheLogic.fetchStats();
    }, 5000);

    queueLogic.subscribeToMessage(MESSAGE_QUEUES.CACHE, MESSAGES.CACHE.COMMANDS.RENEW_TIPS, async message => {
      await CacheLogic.invalidateTipsCache();
      await CacheLogic.getTips();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.CACHE, message.id);
    });
  }

  static async findContractEvents() {
    const fetchContractEvents = async () => {
      const height = await aeternity.client.height();
      const contractTransactions = await MdwLogic.middlewareContractTransactions(height);
      return contractTransactions.asyncMap(tx => aeternity.decodeTransactionEventsFromMdw(tx));
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
      await queueLogic.sendMessage(MESSAGE_QUEUES.CACHE, MESSAGES.CACHE.EVENTS.RENEWED_TIPS);
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

  static async getWordRegistryAndSaleData() {
    const wordRegistryData = await CacheLogic.getWordRegistryData();
    return wordRegistryData.tokens.asyncMap(async ([word, sale]) => {
      const wordSaleDetails = await CacheLogic.wordSaleDetails(sale);

      return {
        word,
        sale,
        ...wordSaleDetails,
      };
    });
  }

  static async getWordRegistryData() {
    return cache.getOrSet(['wordRegistryData'], () => aeternity.fetchWordRegistryData(), cache.shortCacheTime);
  }

  static async wordSaleDetails(address) {
    const wordSaleState = await cache.getOrSet(['wordSaleState', address],
      () => aeternity.wordSaleState(address));
    const totalSupply = cache.getOrSet(['fungibleTokenTotalSupply', wordSaleState.token],
      async () => aeternity.fungibleTokenTotalSupply(wordSaleState.token), cache.shortCacheTime);

    const price = cache.getOrSet(['wordSalePrice', address],
      () => aeternity.wordSalePrice(address), cache.shortCacheTime);

    const [buy, sell] = await price;
    return {
      wordSaleAddress: address,
      tokenAddress: wordSaleState.token,
      totalSupply: await totalSupply,
      buyPrice: buy,
      sellPrice: sell,
      spread: wordSaleState.spread,
      description: wordSaleState.description,
    };
  }

  static async wordPriceHistory(wordSale) {
    const height = await aeternity.client.height();
    const txs = await MdwLogic.getContractTransactions(height, wordSale);

    const eventsSchema = [
      { name: 'Buy', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.int] },
      { name: 'Sell', types: [SOPHIA_TYPES.address, SOPHIA_TYPES.int, SOPHIA_TYPES.int] },
    ];

    return txs.flatMap(tx => {
      const decodedEvent = () => {
        const decodedEvents = decodeEvents(tx.tx.log, { schema: eventsSchema })
          .flatMap(({ name, decoded }) => ({ name, decoded }))
          .filter(log => log.decoded.length);

        if (decodedEvents.length === 1) {
          const [event] = decodedEvents;
          switch (event.name) {
            case 'Buy':
              return {
                event: event.name,
                address: event.decoded[0],
                price: event.decoded[1],
                amount: event.decoded[2],
                perToken: new BigNumber(event.decoded[1]).dividedBy(event.decoded[2]),
              };
            case 'Sell':
              return {
                event: event.name,
                address: event.decoded[0],
                return: event.decoded[1],
                amount: event.decoded[2],
                perToken: new BigNumber(event.decoded[1]).dividedBy(event.decoded[2]),
              };
            default:
              return {};
          }
        }

        return {};
      };

      return {
        timestamp: tx.micro_time,
        ...decodedEvent(),
      };
    }).filter(event => event.event);
  }

  static async refreshWordAndVoteData() {
    return lock.acquire('CacheLogic.refreshWordAndVoteData', async () => {
      const wordRegistryData = await CacheLogic.getWordRegistryData();

      return Promise.all([
        wordRegistryData.tokens.asyncMap(async ([, wordSale]) => {
          const details = await CacheLogic.wordSaleDetails(wordSale);
          return CacheLogic.getTokenMetaInfo(details.tokenAddress);
        }),
        wordRegistryData.tokens.asyncMap(([, wordSale]) => CacheLogic.wordSaleVotesDetails(wordSale)),
      ]);
    });
  }

  static async wordSaleDetailsByToken(address) {
    const wordRegistryData = await CacheLogic.getWordRegistryData();
    const wordDetails = await wordRegistryData.tokens.asyncMap(
      async ([, wordSale]) => ({ tokenAddress: await CacheLogic.getWordSaleTokenAddress(wordSale), sale: wordSale }),
    );

    const saleDetails = wordDetails.find(sale => sale.tokenAddress === address);
    return saleDetails ? CacheLogic.wordSaleDetails(saleDetails.sale) : null;
  }

  // TODO trigger these via message queue
  static async wordSaleVotesDetails(address) {
    const votes = await cache.getOrSet(['wordSaleVotes', address],
      () => aeternity.wordSaleVotes(address), cache.shortCacheTime);

    return Promise.all(votes.map(([id, vote]) => CacheLogic.wordSaleVoteInfo(id, vote[1], vote[0], address)));
  }

  static getWordSaleTokenAddress(sale) {
    return cache.getOrSet(['wordSaleTokenAddress', sale],
      () => aeternity.wordSaleTokenAddress(sale));
  }

  static async wordSaleVoteInfo(id, vote, alreadyApplied, sale) {
    const state = cache.getOrSet(['wordSaleVoteState', vote],
      () => aeternity.wordSaleVoteState(vote), cache.shortCacheTime);

    const voteTimeout = cache.getOrSet(['wordSaleVoteTimeout', sale],
      () => aeternity.wordSaleVoteTimeout(sale));

    const height = await aeternity.client.height();

    const votedFor = (await state).vote_state.find(([s]) => s)[1];
    const votedAgainst = (await state).vote_state.find(([s]) => !s)[1];
    const ifAgainstZero = votedFor === 0 ? 0 : 100;
    const votedPositive = new BigNumber(votedFor)
      .dividedBy(new BigNumber(votedFor).plus(votedAgainst)).times(100).toFixed(0);

    const tokenAddress = CacheLogic.getWordSaleTokenAddress(sale);

    const totalSupply = cache.getOrSet(['fungibleTokenTotalSupply', await tokenAddress],
      async () => aeternity.fungibleTokenTotalSupply(await tokenAddress), cache.shortCacheTime);

    const stakePercent = (await totalSupply) ? new BigNumber(votedFor).dividedBy(await totalSupply).times(100).toFixed(0) : '0';
    const timeoutHeight = (await state).close_height + (await voteTimeout);
    return {
      id,
      alreadyApplied,
      voteAddress: vote,
      subject: (await state).metadata.subject,
      timeouted: timeoutHeight < (await height),
      timeoutHeight,
      closeHeight: (await state).close_height,
      voteAccounts: (await state).vote_accounts,
      isClosed: (await height) >= (await state).close_height,
      isSuccess: new BigNumber(stakePercent).isGreaterThan(50),
      votePercent: votedAgainst !== 0 ? votedPositive : ifAgainstZero,
      stakePercent,
    };
  }

  static async getOracleState() {
    return cache.getOrSet(['oracleState'], () => aeternity.fetchOracleState(), cache.shortCacheTime);
  }

  static async fetchChainNames() {
    return cache.getOrSet(['fetchChainNames'], async () => {
      const chainNames = await MdwLogic.getChainNames();
      await queueLogic.sendMessage(MESSAGE_QUEUES.CACHE, MESSAGES.CACHE.EVENTS.RENEWED_CHAINNAMES);
      return chainNames;
    }, cache.shortCacheTime);
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

  static async invalidateWordRegistryCache(req, res) {
    await cache.del(['wordRegistryData']);
    await CacheLogic.getWordRegistryData(); // wait for cache update to let frontend know data availability
    if (res) res.send({ status: 'OK' });
  }

  static async invalidateWordSaleVotesCache(req, res) {
    await cache.del(['wordSaleVotes', req.params.wordSale]);
    await CacheLogic.wordSaleVotesDetails(req.params.wordSale); // wait for cache update to let frontend know data availability
    if (res) res.send({ status: 'OK' });
  }

  static async invalidateWordSaleVoteStateCache(req, res) {
    await cache.del(['wordSaleVoteState', req.params.vote]);
    if (res) res.send({ status: 'OK' });
  }

  static async invalidateWordSaleCache(req, res) {
    const tokenAddress = await CacheLogic.getWordSaleTokenAddress(req.params.wordSale);

    await cache.del(['wordSalePrice', req.params.wordSale]);
    await cache.del(['wordSaleState', req.params.wordSale]);
    await cache.del(['fungibleTokenTotalSupply', tokenAddress]);
    await CacheLogic.wordSaleDetails(req.params.wordSale); // wait for cache update to let frontend know data availability
    if (res) res.send({ status: 'OK' });
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

  static async getTx(hash) {
    return cache.getOrSet(['tx', hash], async () => aeternity.fetchTx(hash));
  }
};
