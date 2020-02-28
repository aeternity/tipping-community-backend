const ae = require('../utils/aeternity.js');
const { Tip } = require('../utils/database.js');
const LinkPreviewLogic = require('./linkPreviewLogic.js');

module.exports = class CacheLogic {
  interval = null;

  constructor () {
    this.init();
  }

  async init () {
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

  async getStatus () {
    return {
      interval: this.interval ? !this.interval._destroyed : false,
      lastRun: this.lastRun,
      error: this.error ? this.error.message : null,
      lastError: this.lastError,
      totalRows: await Tip.count(),
    };
  }

  static async deliverAllItems (req, res) {
    res.send(await CacheLogic.getAllItems());
  }

  static async getAllItems () {
    return Tip.findAll({ raw: true });
  }

  static async getAllTips () {
    return ae.getTips();
  }

  static async updateOnNewUrl (url) {
    return Promise.all([
      LinkPreviewLogic.generatePreview(url),
    ]);
  }

  static async updateTipsInDatabase () {
    const tips = await CacheLogic.getAllTips();
    const dbEntries = await CacheLogic.getAllItems();
    const peparedTips = tips.filter(({id}) => !dbEntries.some(entry => entry.tipId === id))
      .map((data) => ({ ...data, tipId: data.id }));
    if (peparedTips.length > 0) {
      await Tip.bulkCreate(peparedTips, { ignoreDuplicates: true });
      // UPDATE STORAGE SYNC TO AVOID DDOS BLOCKING
      for (const { url } of peparedTips) {
        await CacheLogic.updateOnNewUrl(url);
      }
    }
  }

  static async getTipByUrl (url, nonce = null) {
    return nonce ? Tip.findOne({ where: { url, nonce }, raw: true }) : Tip.findAll({ where: { url }, raw: true });
  }

};
