const aeternity = require('../utils/aeternity.js');
const LinkPreviewLogic = require('./linkPreviewLogic.js');
const TipOrderLogic = require('./tiporderLogic');
const CommentLogic = require('./commentLogic');
const axios = require('axios');
const cache = require('../utils/cache');
const BigNumber = require('bignumber.js');
var AsyncLock = require('async-lock');
var lock = new AsyncLock();
const {getTipTopics} = require('../utils/tipTopicUtil');
const Util = require('../utils/util');

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'https://mainnet.aeternity.io/';

module.exports = class CacheLogic {

  constructor() {
    this.init();
  }

  async init() {
    // Run once so the db is synced initially without getting triggered every 5 seconds
    await aeternity.init();

    const keepHotFunction = async () => {
      await CacheLogic.getTipsCheckPreviews();
      await CacheLogic.fetchChainNames();
      await CacheLogic.fetchPrice();
      await aeternity.getOracleState();
      await CacheLogic.findContractEvents();
    };

    await cache.init(aeternity, keepHotFunction);
  }

  static async findContractEvents() {
    const fetchContractEvents = async () => {
      const contractTransactions = await aeternity.middlewareContractTransactions();
      return contractTransactions.asyncMap(aeternity.transactionEvent);
    }

    return cache.getOrSet(["contractEvents"], async () => {
      return fetchContractEvents().catch(console.error);
    }, cache.shortCacheTime)
  }

  static async getChainNames() {
    return axios.get(`${MIDDLEWARE_URL}/middleware/names/active`).then(res => res.data).catch(console.error);
  }

  static async fetchPrice() {
    return cache.getOrSet(["fetchPrice"], async () => {
      return axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,cny').then(res => res.data).catch(console.error);
    }, cache.longCacheTime)
  }

  static async getTipsCheckPreviews() {
    const tips = await aeternity.getTips();

    // not await on purpose, just trigger background preview fetch
    lock.acquire("LinkPreviewLogic.fetchAllLinkPreviews", async () => {
      const previews = await LinkPreviewLogic.fetchAllLinkPreviews();
      const tipUrls = [...new Set(tips.map(tip => tip.url))];
      const previewUrls = [...new Set(previews.map(preview => preview.requestUrl))];

      const difference = tipUrls.filter(url => !previewUrls.includes(url));

      await difference.asyncMap(async (url) => {
        await LinkPreviewLogic.generatePreview(url).catch(console.error);
      })
    });

    return tips;
  }

  static fetchChainNames() {
    return cache.getOrSet(["getChainNames"], async () => {
      const result = await CacheLogic.getChainNames();
      return result.reduce((acc, chainName) => {
        if (!chainName.pointers) return acc;

        const accountPubkeyPointer = chainName.pointers.find(pointer => pointer.key === "account_pubkey");
        const pubkey = accountPubkeyPointer ? accountPubkeyPointer.id : null;
        if (!pubkey) return acc;

        if (acc[pubkey]) {
          // shorter always replaces
          if (chainName.name.length < acc[pubkey].length) acc[pubkey] = chainName.name;
          // equal length replaces if alphabetically earlier
          if (chainName.name.length === acc[pubkey].length && chainName.name < acc[pubkey]) acc[pubkey] = chainName.name;
        } else {
          acc[pubkey] = chainName.name;
        }

        return acc;
      }, {});
    }, cache.shortCacheTime)
  };

  static async getAllTips() {
    let [tips, tipOrdering, tipsPreview, chainNames, commentCounts] = await Promise.all([
      CacheLogic.getTipsCheckPreviews(), TipOrderLogic.fetchTipOrder(CacheLogic.fetchTips), LinkPreviewLogic.fetchAllLinkPreviews(),
      CacheLogic.fetchChainNames(), CommentLogic.fetchCommentCountForTips(),
    ]);

    // add score from backend to tips
    if (tipOrdering) {
      const blacklistedTipIds = tipOrdering.map(order => order.id);
      const filteredTips = tips.filter(tip => blacklistedTipIds.includes(tip.id));
      tips = filteredTips.map(tip => {
        const orderItem = tipOrdering.find(order => order.id === tip.id);
        tip.score = orderItem ? orderItem.score : 0;
        return tip;
      });
    }

    // add preview to tips from backend
    if (tipsPreview) {
      tips = tips.map(tip => {
        tip.preview = tipsPreview.find(preview => preview.requestUrl === tip.url);
        return tip;
      });
    }

    if (chainNames) {
      tips = tips.map(tip => {
        tip.chainName = chainNames[tip.sender];
        return tip;
      });
    }

    if (commentCounts) {
      tips = tips.map(tip => {
        const commentCount = commentCounts.find(comment => comment.tipId === tip.id);
        tip.commentCount = commentCount ? commentCount.count : 0;
        return tip;
      });
    }

    return tips;
  }

  static async invalidateTips(req, res) {
    await cache.del(["getTips"]);
    aeternity.getTips(); //just trigger cache update, so follow up requests may have it cached already
    if (res) res.send({status: "OK"});
  }

  static async invalidateOracle(req, res) {
    await cache.del(["oracleState"]);
    aeternity.getOracleState(); //just trigger cache update, so follow up requests may have it cached already
    if (res) res.send({status: "OK"});
  }

  static async invalidateContractEvents(req, res) {
    await cache.del(["contractEvents"]);
    CacheLogic.findContractEvents(); //just trigger cache update, so follow up requests may have it cached already
    if (res) res.send({status: "OK"});
  }

  static async deliverTip(req, res) {
    let tips = await CacheLogic.getAllTips();
    res.send(tips.find(tip => tip.id === parseInt(req.query.id)));
  }

  static async deliverTips(req, res) {
    let limit = 30;
    let tips = await CacheLogic.getAllTips();

    if (req.query.address) {
      tips = tips.filter((tip) => tip.sender === req.query.address);
    }

    if (req.query.search) {
      const term = req.query.search.toLowerCase();

      const urlSearchResults = tips.filter((tip) => tip.url.toLowerCase().includes(term));
      const senderSearchResults = tips.filter((tip) => tip.sender.toLowerCase().includes(term));
      const noteSearchResults = tips.filter((tip) => tip.title.toLowerCase().includes(term));

      // We convert the result array to Set in order to remove duplicate records
      const convertResultToSet = new Set([...urlSearchResults, ...senderSearchResults, ...noteSearchResults]);
      tips = [...convertResultToSet];
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
    if (req.query.limit) contractEvents = contractEvents.slice(0, parseInt(req.query.limit));
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
    const userTips = allTips.filter((tip) => tip.sender === req.query.address);

    const userReTips = allTips.flatMap((tip) => tip.retips.filter((retip) => retip.sender === req.query.address));
    const totalTipAmount = Util.atomsToAe(userTips
      .reduce((acc, tip) => acc.plus(tip.amount), new BigNumber(0))
      .plus(userReTips.reduce((acc, tip) => acc.plus(tip.amount), new BigNumber(0)))).toFixed(2);

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
      totalTipAmount,
      claimedUrlsLength: claimedUrls.length,
      unclaimedAmount,
      claimedAmount,
      userComments: await CommentLogic.fetchCommentCountForAddress(req.query.address),
    };

    res.send(stats);
  }

  static async deliverStats(req, res) {
    const tips = await aeternity.getTips();

    const groupedByUrl = Util.groupBy(tips, 'url');
    const statsByUrl = Object.keys(groupedByUrl).map(url => {
      return {
        url: url,
        ...CacheLogic.statsForTips(groupedByUrl[url])
      }
    });

    const stats = {
      ...CacheLogic.statsForTips(tips),
      by_url: statsByUrl,
    };

    res.send(stats);
  }

  static statsForTips(tips) {
    const senders = [...new Set(tips
      .reduce((acc, tip) => acc
        .concat([tip.sender, ...tip.retips.map((retip) => retip.sender)]), []))];

    const retips_length = tips.reduce((acc, tip) => acc + tip.retips.length, 0);

    return {
      tips_length: tips.length,
      retips_length: retips_length,
      total_tips_length: tips.length + retips_length,
      total_amount: tips.reduce((acc, tip) => acc.plus(tip.total_amount), new BigNumber('0')).toFixed(),
      total_unclaimed_amount: tips.reduce((acc, tip) => acc.plus(tip.total_unclaimed_amount), new BigNumber('0')).toFixed(),
      total_claimed_amount: tips.reduce((acc, tip) => acc.plus(tip.total_claimed_amount), new BigNumber('0')).toFixed(),
      senders: senders,
      senders_length: senders.length
    }
  }

  static async deliverOracleState(req, res) {
    res.send(await aeternity.getOracleState());
  }

  static async deliverTipTopics(req, res) {
    const tips = await CacheLogic.getAllTips();
    res.send(getTipTopics(tips));
  }

};
