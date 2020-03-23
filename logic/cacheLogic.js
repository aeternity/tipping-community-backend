const aeternity = require('../utils/aeternity.js');
const {Tip} = require('../models');
const LinkPreviewLogic = require('./linkPreviewLogic.js');
const TipOrderLogic = require('./tiporderLogic');
const CommentLogic = require('./commentLogic');
const {wrapTry} = require('../utils/util');
const axios = require('axios');
const cache = require('../utils/cache');

const MAINNET_URL = 'https://mainnet.aeternal.io/';

module.exports = class CacheLogic {

  constructor() {
    this.init();
  }

  async init() {
    // Run once so the db is synced initially without getting triggered every 5 seconds
    await aeternity.init();

    const keepHotFunction = async () => {
      await CacheLogic.fetchTips();
      await CacheLogic.fetchChainNames();
    };

    await cache.init(aeternity, keepHotFunction);
  }

  static async getChainNames() {
    return wrapTry(async () => {
      return axios.get(`${MAINNET_URL}/middleware/names/active`).catch(console.error);
    });
  };

  static fetchTips() { return cache.getOrSet(["getTips"], () => aeternity.getTips(), cache.shortCacheTime) };
  static fetchChainNames() { return cache.getOrSet(["getChainNames"], () => CacheLogic.getChainNames(), cache.shortCacheTime) };

  static async getAllTips() {
    let [fetchTipsResponse, tipOrdering, tipsPreview, chainNames, commentCounts] = await Promise.all([
      CacheLogic.fetchTips(), TipOrderLogic.fetchTipOrder(CacheLogic.fetchTips), LinkPreviewLogic.fetchLinkPreview(),
      CacheLogic.fetchChainNames(), CommentLogic.fetchCommentCountForTips(),
    ]);

    let { tips } = fetchTipsResponse;

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
      chainNames = chainNames.reduce((acc, chainName) => {
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

    return {
      stats: fetchTipsResponse.stats, tips, hasOrdering: !!tipOrdering, chainNames,
    };
  }

  static async deliverAllItems(req, res) {
    res.send(await CacheLogic.getAllTips());
  }
};
