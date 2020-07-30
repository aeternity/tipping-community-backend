const axios = require('axios');
const BigNumber = require('bignumber.js');
const Fuse = require('fuse.js');
const LanguageDetector = require('languagedetect');

const aeternity = require('../utils/aeternity.js');
const LinkPreviewLogic = require('./linkPreviewLogic.js');
const TipOrderLogic = require('./tiporderLogic');
const CommentLogic = require('./commentLogic');
const TipLogic = require('./tipLogic');
const RetipLogic = require('./retipLogic');
const NotificationLogic = require('./notificationLogic');
const BlacklistLogic = require('./blacklistLogic');
const AsyncTipGeneratorsLogic = require('./asyncTipGeneratorsLogic');
const cache = require('../utils/cache');
const { getTipTopics, topicsRegex } = require('../utils/tipTopicUtil');
const Util = require('../utils/util');
const { Profile } = require('../models');
const Logger = require('../utils/logger');

const logger = new Logger('CacheLogic');
const lngDetector = new LanguageDetector();
lngDetector.setLanguageType('iso2');

const searchOptions = {
  threshold: 0.3,
  includeScore: true,
  shouldSort: false,
  keys: ['title', 'chainName', 'sender', 'preview.description', 'preview.title', 'url', 'topics'],
};

module.exports = class CacheLogic {
  constructor() {
    CacheLogic.init();
  }

  static async init() {
    const keepHotFunction = async () => {
      await CacheLogic.getTipsAndVerifyLocalInfo();
      await CacheLogic.fetchChainNames();
      await CacheLogic.fetchPrice();
      await aeternity.getOracleState();
      await CacheLogic.findContractEvents();
    };

    await cache.setKeepHot(keepHotFunction);
  }

  static async findContractEvents() {
    const fetchContractEvents = async () => {
      const contractTransactions = await aeternity.middlewareContractTransactions();
      return contractTransactions.map(tx => tx.hash).asyncMap(hash => aeternity.transactionEvents(hash));
    };

    return cache.getOrSet(['contractEvents'], async () => fetchContractEvents().catch(logger.error), cache.shortCacheTime);
  }

  static async fetchPrice() {
    return cache.getOrSet(
      ['fetchPrice'],
      async () => axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,cny')
        .then(res => res.data).catch(logger.error),
      cache.longCacheTime,
    );
  }

  static async getTipsAndVerifyLocalInfo() {
    const tips = await aeternity.getTips();

    // not await on purpose, just trigger background actions
    AsyncTipGeneratorsLogic.triggerGeneratePreviews(tips);
    AsyncTipGeneratorsLogic.triggerLanguageDetection(tips);
    AsyncTipGeneratorsLogic.triggerGetTokenContractIndex(tips);
    AsyncTipGeneratorsLogic.triggerFetchAllLocalTips(tips);

    await lock.acquire('TipLogic.fetchAllLocalRetips', async () => {
      const localRetips = await RetipLogic.fetchAllLocalRetips();
      const remoteRetips = [...new Set(tips.map(tip => tip.retips.map(retip => ({ ...retip, parentTip: tip }))).flat())];
      const remoteRetipIds = [...new Set(remoteRetips.map(retip => retip.id))];
      const localRetipIds = [...new Set(localRetips.map(retip => retip.id))];

      const difference = remoteRetipIds.filter(id => !localRetipIds.includes(id));

      // Send appropriate notifications for new tips
      await difference.asyncMap(id => NotificationLogic.handleNewRetip(remoteRetips.find(retip => retip.id === id)));
    });

    return tips;
  }

  static fetchChainNames() {
    return cache.getOrSet(['getChainNames'], async () => {
      const result = await aeternity.getChainNames();
      const allProfiles = await Profile.findAll({ raw: true });

      return result.reduce((acc, chainName) => {
        if (!chainName.pointers) return acc;

        const accountPubkeyPointer = chainName.pointers.find(pointer => pointer.key === 'account_pubkey');
        const pubkey = accountPubkeyPointer ? accountPubkeyPointer.id : null;
        if (!pubkey) return acc;

        // already found a chain name
        if (acc[pubkey]) {
          // shorter always replaces
          if (chainName.name.length < acc[pubkey].length) acc[pubkey] = chainName.name;
          // equal length replaces if alphabetically earlier
          if (chainName.name.length === acc[pubkey].length && chainName.name < acc[pubkey]) acc[pubkey] = chainName.name;
        } else {
          acc[pubkey] = chainName.name;
        }

        const currentProfile = allProfiles.find(profile => profile.author === pubkey);
        if (currentProfile && currentProfile.preferredChainName) {
          acc[pubkey] = currentProfile.preferredChainName;
        }

        return acc;
      }, {});
    }, cache.shortCacheTime);
  }

  static async getAllTips(blacklist = true) {
    const [allTips, tipsPreview, chainNames, commentCounts, blacklistedIds, localTips] = await Promise.all([
      CacheLogic.getTipsAndVerifyLocalInfo(), LinkPreviewLogic.fetchAllLinkPreviews(), CacheLogic.fetchChainNames(),
      CommentLogic.fetchCommentCountForTips(), BlacklistLogic.getBlacklistedIds(), TipLogic.fetchAllLocalTips(),
    ]);

    let tips = allTips;

    // filter by blacklisted from backend
    if (blacklist && blacklistedIds) {
      tips = tips.filter(tip => !blacklistedIds.includes(tip.id));
    }

    // add preview to tips from backend
    if (tipsPreview) {
      tips = tips.map(tip => {
        const preview = tipsPreview.find(linkPreview => linkPreview.requestUrl === tip.url);
        return { ...tip, preview };
      });
    }

    // add language to tips from backend
    if (localTips) {
      tips = tips.map(tip => {
        const result = localTips.find(localTip => localTip.id === tip.id);
        return { ...tip, contentLanguage: result ? result.language : null };
      });
    }

    // add chain names for each tip sender
    if (chainNames) {
      tips = tips.map(tip => ({ ...tip, chainName: chainNames[tip.sender] }));
    }

    // add comment count to each tip
    if (commentCounts) {
      tips = tips.map(tip => {
        const result = commentCounts.find(comment => comment.tipId === tip.id);
        return { ...tip, commentCount: result ? result.count : 0 };
      });
    }

    // add score to tips
    tips = TipOrderLogic.applyTipScoring(tips);

    return tips;
  }

  static async invalidateTips(req, res) {
    await cache.del(['getTips']);
    aeternity.getTips(); // just trigger cache update, so follow up requests may have it cached already
    if (res) res.send({ status: 'OK' });
  }

  static async invalidateOracle(req, res) {
    await cache.del(['oracleState']);
    aeternity.getOracleState(); // just trigger cache update, so follow up requests may have it cached already
    if (res) res.send({ status: 'OK' });
  }

  static async invalidateContractEvents(req, res) {
    await cache.del(['contractEvents']);
    CacheLogic.findContractEvents(); // just trigger cache update, so follow up requests may have it cached already
    if (res) res.send({ status: 'OK' });
  }

  static async deliverTip(req, res) {
    const tips = await CacheLogic.getAllTips(false);
    const result = tips.find(tip => tip.id === parseInt(req.query.id, 10));
    return result ? res.send(result) : res.sendStatus(404);
  }

  static async deliverTips(req, res) {
    const limit = 30;
    let tips = await CacheLogic.getAllTips(req.query.blacklist !== 'false');

    if (req.query.address) {
      tips = tips.filter(tip => tip.sender === req.query.address);
    }

    if (req.query.search) {
      let searchTips = tips;

      // if topics exist, only show topics
      const searchTopics = req.query.search.match(topicsRegex);
      if (searchTopics) {
        searchTips = tips.filter(tip => searchTopics.every(topic => tip.topics.includes(topic)));
      }

      // otherwise fuzzy search all content
      if (searchTopics === null || searchTips.length === 0) {
        // TODO consider indexing
        searchTips = new Fuse(tips, searchOptions).search(req.query.search).map(result => {
          const tip = result.item;
          tip.searchScore = result.item.score;
          return tip;
        });
      }

      tips = searchTips;
    }

    if (req.query.language) {
      const requestedLanguages = req.query.language.split('|');
      tips = tips.filter(tip => tip.preview && requestedLanguages.includes(tip.preview.lang)
        && (!tip.contentLanguage || requestedLanguages.includes(tip.contentLanguage)));
    }

    if (req.query.ordering) {
      switch (req.query.ordering) {
        case 'hot':
          tips.sort((a, b) => b.score - a.score);
          break;
        case 'latest':
          tips.sort((a, b) => b.timestamp - a.timestamp);
          break;
        case 'highest':
          tips.sort((a, b) => new BigNumber(b.total_amount).minus(a.total_amount).toNumber());
          break;
        default:
      }
    }

    if (req.query.page) {
      tips = tips.slice((req.query.page - 1) * limit, req.query.page * limit);
    }

    res.send(tips);
  }

  static async deliverContractEvents(req, res) {
    let contractEvents = await CacheLogic.findContractEvents();
    if (req.query.address) contractEvents = contractEvents.filter(e => e.address === req.query.address);
    if (req.query.event) contractEvents = contractEvents.filter(e => e.event === req.query.event);
    contractEvents.sort((a, b) => b.time - a.time);
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
    const oracleState = await aeternity.getOracleState();
    const allTips = await CacheLogic.getAllTips();
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

  static async deliverStats(req, res) {
    const tips = await aeternity.getTips();

    const groupedByUrl = Util.groupBy(tips, 'url');
    const statsByUrl = Object.keys(groupedByUrl).map(url => ({
      url,
      ...CacheLogic.statsForTips(groupedByUrl[url]),
    }));

    const stats = {
      ...CacheLogic.statsForTips(tips),
      by_url: statsByUrl,
    };

    res.send(stats);
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
    res.send(await aeternity.getOracleState());
  }

  static async deliverTipTopics(req, res) {
    const tips = await CacheLogic.getAllTips();
    res.send(getTipTopics(tips));
  }
};
