const WORD_SALE_ACI = require('wordbazaar-contracts/generated/TokenSale.aci.json');
const BigNumber = require('bignumber.js');
const AsyncLock = require('async-lock');
const axios = require('axios');
const { isAddressValid } = require('@aeternity/aepp-sdk');
const aeternity = require('../../aeternity/logic/aeternity');
const cache = require('../utils/cache');
const queueLogic = require('../../queue/logic/queueLogic');
const TipLogic = require('../../tip/logic/tipLogic');

const lock = new AsyncLock();
const MdwLogic = require('../../aeternity/logic/mdwLogic');
const { MESSAGES, MESSAGE_QUEUES } = require('../../queue/constants/queue');

// hack to serialize bigint
BigInt.prototype.toJSON = function () { return this.toString(); };

const logger = require('../../../utils/logger')(module);

const CacheLogic = {
  init() {
    CacheLogic.keepHot();
  },

  async keepHotFunction() {
    await CacheLogic.fetchMdwChainNames();
    await CacheLogic.fetchPrice();
    await CacheLogic.getTokenInfos();
    if (process.env.WORD_REGISTRY_CONTRACT) {
      await CacheLogic.refreshWordAndVoteData(); // keeps hot even if undefined is passed as argument
    }
  },

  keepHot() {
    const keepHotLogic = async () => lock.acquire('keepHotLogic', async () => {
      const start = new Date().getTime();
      await CacheLogic.keepHotFunction();
      logger.info(`cache keepHot ${new Date().getTime() - start}ms`);
    });

    queueLogic.subscribeToMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, MESSAGES.SCHEDULED_EVENTS.COMMANDS.CACHE_KEEPHOT, async message => {
      await keepHotLogic();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, message.id);
    });
  },

  async fetchPrice() {
    return cache.getOrSet(
      ['fetchPrice'],
      async () => axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,cny')
        .then(res => res.data).catch(logger.error),
      cache.longCacheTime,
    );
  },

  async triggerGetTokenContractIndex(tips) {
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
  },

  async getWordRegistryAndSaleData() {
    const wordRegistryData = await CacheLogic.getWordRegistryData();
    return Array.from(wordRegistryData.tokens).asyncMap(async ([word, sale]) => {
      const wordSaleDetails = await CacheLogic.getWordSaleDetails(sale);

      return {
        word,
        sale,
        ...wordSaleDetails,
      };
    });
  },

  async getWordRegistryData() {
    return cache.getOrSet(['wordRegistryData'], () => aeternity.fetchWordRegistryData(), cache.shortCacheTime);
  },

  async getWordSaleDetails(address) {
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
  },

  async wordPriceHistory(wordSale) {
    const height = await aeternity.getHeight();
    const txs = await MdwLogic.getContractTransactions(height, 0, wordSale);

    return txs.flatMap(tx => {
      const decodedEvent = () => {
        const decodedEvents = aeternity.decodeEvents(tx.tx.log, WORD_SALE_ACI, 'TokenSale');

        // FIXME: there could be more than one legit event per tx
        if (decodedEvents.length === 1) {
          const [event] = decodedEvents;
          switch (event.name) {
            case 'Buy':
              return {
                event: event.name,
                address: event.args[0],
                price: event.args[1],
                amount: event.args[2],
                perToken: new BigNumber(event.args[1]).dividedBy(event.args[2]),
              };
            case 'Sell':
              return {
                event: event.name,
                address: event.args[0],
                return: event.args[1],
                amount: event.args[2],
                perToken: new BigNumber(event.args[1]).dividedBy(event.args[2]),
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
  },

  async refreshWordAndVoteData() {
    return lock.acquire('refreshWordAndVoteData', async () => {
      const wordRegistryData = await CacheLogic.getWordRegistryData();

      return Promise.all([
        Array.from(wordRegistryData.tokens).asyncMap(async ([, wordSale]) => {
          const details = await CacheLogic.getWordSaleDetails(wordSale);
          return CacheLogic.getTokenMetaInfo(details.tokenAddress);
        }),
        Array.from(wordRegistryData.tokens).asyncMap(([, wordSale]) => CacheLogic.wordSaleVotesDetails(wordSale)),
      ]);
    });
  },

  async wordSaleDetailsByToken(address) {
    const wordRegistryData = await CacheLogic.getWordRegistryData();
    const wordDetails = await Array.from(wordRegistryData.tokens).asyncMap(
      async ([, wordSale]) => ({ tokenAddress: await CacheLogic.getWordSaleTokenAddress(wordSale), sale: wordSale }),
    );

    const saleDetails = wordDetails.find(sale => sale.tokenAddress === address);
    return saleDetails ? CacheLogic.getWordSaleDetails(saleDetails.sale) : null;
  },

  // TODO trigger these via message queue
  async wordSaleVotesDetails(address) {
    const votes = await cache.getOrSet(['wordSaleVotes', address],
      () => aeternity.wordSaleVotes(address), cache.shortCacheTime);
    return Promise.all(votes.map(([id, vote]) => CacheLogic.wordSaleVoteInfo(id, vote[1], vote[0], address)));
  },

  getWordSaleTokenAddress(sale) {
    return cache.getOrSet(['wordSaleTokenAddress', sale],
      () => aeternity.wordSaleTokenAddress(sale));
  },

  async wordSaleVoteInfo(id, vote, alreadyApplied, sale) {
    const state = cache.getOrSet(['wordSaleVoteState', vote],
      () => aeternity.wordSaleVoteState(vote), cache.shortCacheTime);

    const voteTimeout = cache.getOrSet(['wordSaleVoteTimeout', sale],
      () => aeternity.wordSaleVoteTimeout(sale));

    const height = await aeternity.getHeight();

    const votedFor = Array.from((await state).vote_state)?.find(([s]) => s)?.[1] || 0;
    const votedAgainst = Array.from((await state).vote_state)?.find(([s]) => !s)?.[1] || 0;
    const ifAgainstZero = votedFor === 0 ? 0 : 100;
    const votedPositive = new BigNumber(votedFor || 0)
      .dividedBy(new BigNumber(votedFor).plus(votedAgainst)).times(100).toFixed(0);

    const tokenAddress = CacheLogic.getWordSaleTokenAddress(sale);

    const totalSupply = cache.getOrSet(['fungibleTokenTotalSupply', await tokenAddress],
      async () => aeternity.fungibleTokenTotalSupply(await tokenAddress), cache.shortCacheTime);

    const stakePercent = (await totalSupply !== 0n) ? new BigNumber(votedFor).dividedBy(await totalSupply).times(100).toFixed(0) : '0';
    const timeoutHeight = Number((await state).close_height) + Number((await voteTimeout));
    return {
      id,
      alreadyApplied,
      voteAddress: vote,
      subject: (await state).metadata.subject,
      timeouted: timeoutHeight < height,
      timeoutHeight,
      closeHeight: Number((await state).close_height),
      voteAccounts: Array.from((await state).vote_accounts),
      isClosed: height >= Number((await state).close_height),
      isSuccess: new BigNumber(stakePercent).isGreaterThan(50),
      votePercent: votedAgainst !== 0 ? votedPositive : ifAgainstZero,
      stakePercent,
    };
  },

  async getOracleClaimedUrls(address) {
    return cache.getOrSet(['getOracleClaimedUrls', address], () => aeternity.fetchOracleClaimedUrls(address), cache.shortCacheTime);
  },

  async getOracleAllClaimedUrls() {
    return cache.getOrSet(['getOracleAllClaimedUrls'], () => aeternity.getOracleAllClaimedUrls(), cache.shortCacheTime);
  },

  async fetchChainNames(profiles) {
    return cache.getOrSet(['fetchChainNames'], async () => {
      const chainNames = await CacheLogic.fetchMdwChainNames();

      return Object.entries(chainNames).reduce(((acc, [pubkey, names]) => {
        if (isAddressValid(pubkey)) {
          const profile = profiles.find(p => p.author === pubkey);
          const preferredChainName = profile ? profile.preferredChainName : null;

          acc[pubkey] = preferredChainName || names[0];
        }
        return acc;
      }), {});
    }, cache.shortCacheTime);
  },

  async fetchMdwChainNames() {
    return cache.getOrSet(['fetchMdwChainNames'], async () => {
      const chainNames = await MdwLogic.getChainNames();
      await queueLogic.sendMessage(MESSAGE_QUEUES.CACHE, MESSAGES.CACHE.EVENTS.RENEWED_CHAINNAMES);
      return chainNames;
    }, cache.shortCacheTime);
  },

  async fetchTokenInfos() {
    const tips = await TipLogic.fetchAllLocalTips();
    return CacheLogic.triggerGetTokenContractIndex(tips);
  },

  async getTokenInfos() {
    return cache.getOrSet(['getTokenInfos'], () => CacheLogic.fetchTokenInfos(), cache.shortCacheTime);
  },

  async getTokenRegistryState() {
    return cache.getOrSet(['getTokenRegistryState'], () => aeternity.fetchTokenRegistryState(), cache.shortCacheTime);
  },

  async getTokenBalances(account) {
    const cacheKeys = ['getTokenAccounts.fetchBalances', account];
    const hasBalanceTokens = await cache.get(cacheKeys);
    return hasBalanceTokens || [];
  },

  async getTokenAccounts(token) {
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
  },

  async getTokenMetaInfo(contractAddress) {
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
  },

  async invalidateStatsCache() {
    await cache.del(['StaticLogic.getStats']);
  },

  async invalidateOracle() {
    await cache.delByPrefix(['getOracleClaimedUrls']);
    await cache.del(['getOracleAllClaimedUrls']);
  },

  async invalidateTokenCache(tokenContractAddress) {
    await cache.del(['getTokenAccounts', tokenContractAddress]);
  },

  async invalidateWordRegistryCache() {
    await cache.del(['wordRegistryData']);
    await CacheLogic.getWordRegistryData(); // wait for cache update to let frontend know data availability
  },

  async invalidateWordSaleVotesCache(wordSale) {
    await cache.del(['wordSaleVotes', wordSale]);
    await CacheLogic.wordSaleVotesDetails(wordSale); // wait for cache update to let frontend know data availability
  },

  async invalidateWordSaleVoteStateCache(voteContract) {
    await cache.del(['wordSaleVoteState', voteContract]);
  },

  async invalidateWordSaleCache(wordSale) {
    const tokenAddress = await CacheLogic.getWordSaleTokenAddress(wordSale);

    await cache.del(['wordSalePrice', wordSale]);
    await cache.del(['wordSaleState', wordSale]);
    await cache.del(['fungibleTokenTotalSupply', tokenAddress]);
    await CacheLogic.getWordSaleDetails(wordSale); // wait for cache update to let frontend know data availability
  },

  async getTx(hash) {
    return cache.getOrSet(['tx', hash], async () => aeternity.fetchTx(hash));
  },
};

module.exports = CacheLogic;
