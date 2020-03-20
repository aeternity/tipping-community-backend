const ae = require('../utils/aeternity.js');
const {Tip} = require('../models');
const LinkPreviewLogic = require('./linkPreviewLogic.js');
const TipOrderLogic = require('./tiporderLogic');
const CommentLogic = require('./commentLogic');
const {wrapTry} = require('../utils/util');
const axios = require('axios');

const MAINNET_URL = 'https://mainnet.aeternal.io/';

module.exports = class CacheLogic {
  interval = null;

  constructor() {
    this.init();
  }

  async init() {
    // Run once so the db is synced initially without getting triggered every 5 seconds
    await ae.init();
    await CacheLogic.updateTipsInDatabase();
    // Then continue to update every 5 seconds
    this.interval = setInterval(async () => {
      try {
        await CacheLogic.updateTipsInDatabase();
        this.lastRun = new Date().toISOString();
      } catch (err) {
        console.error(err);
        this.error = err;
        this.lastError = new Date().toISOString();
      }
    }, 5000);
  }

  async getStatus() {
    return {
      interval: this.interval ? !this.interval._destroyed : false,
      lastRun: this.lastRun,
      error: this.error ? this.error.message : null,
      lastError: this.lastError,
      totalRows: await Tip.count(),
    };
  }

  static async deliverAllItems(req, res) {
    res.send(await CacheLogic.getAllItems());
  }

  static async getAllItems() {
    return Tip.findAll({raw: true});
  }

  static async getChainNameFromAddress() {
    return wrapTry(async () => {
      console.log(`${MAINNET_URL}/middleware/names/active`);
      return axios.get(`${MAINNET_URL}/middleware/names/active`).catch(console.error);
    });
  };

  static async getAllTips() {
    let tips = await ae.getTips();

    const tipOrdering = await TipOrderLogic.fetchTipOrder();
    const tipsPreview = await LinkPreviewLogic.fetchLinkPreview();
    let chainNames = await this.getChainNameFromAddress();
    const commentCounts = await CommentLogic.fetchCommentCountForTips();

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

    console.log(tips);

    return tips;
  }

  static async updateOnNewUrl(url) {
    return Promise.all([
      LinkPreviewLogic.generatePreview(url),
    ]);
  }

  static async updateTipsInDatabase() {
    const tips = await CacheLogic.getAllTips();
    const dbEntries = await CacheLogic.getAllItems();
    const peparedTips = tips.filter(({id}) => !dbEntries.some(entry => parseInt(entry.tipId) === id))
      .map((data) => ({...data, tipId: data.id}));
    if (peparedTips.length > 0) {
      await Tip.bulkCreate(peparedTips, {ignoreDuplicates: true});
      // UPDATE STORAGE SYNC TO AVOID DDOS BLOCKING
      for (const {url} of peparedTips) {
        await CacheLogic.updateOnNewUrl(url);
      }
    }
  }

  static async getTipByUrl(url, nonce = null) {
    return nonce ? Tip.findOne({where: {url, nonce}, raw: true}) : Tip.findAll({where: {url}, raw: true});
  }

};
