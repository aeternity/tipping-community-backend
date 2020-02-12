const ae = require('../utils/aeternity.js');
const { Tip } = require('../utils/database.js');

module.exports = class CacheLogic {

  interval = null;

  constructor () {
    this.init();
  }

  async init () {
    await ae.init();
    await CacheLogic.updateTipsInDatabase();
    this.interval = setInterval(async () => {
      try {
        await CacheLogic.updateTipsInDatabase();
        this.lastRun = new Date().toISOString();
      } catch (err) {
        console.error(err);
        this.error = err;
        clearInterval(this.interval);
      }
    }, 5000);
  }

  async getStatus () {
    return {
      interval: this.interval ? !this.interval._destroyed : false,
      lastRun: this.lastRun,
      error: this.error ? this.error.message : null,
      totalRows: await Tip.count(),
    };
  }

  static async getAllItems () {
    return Tip.findAll({ raw: true });
  }

  static async getAllTips () {
    return ae.callContract();
  }

  static async updateTipsInDatabase () {
    const tips = await CacheLogic.getAllTips();
    const dbEntries = await CacheLogic.getAllItems();
    const peparedTips = tips.filter(tip => !dbEntries.some(entry => entry.tipId === tip[0].join(',')))
      .map(tip => ({ ...tip[1], url: tip[0][0], nonce: tip[0][1], tipId: tip[0].join(',') }));
    await Tip.bulkCreate(peparedTips, { ignoreDuplicates: true });
  }

  static async getTipByUrl (url, nonce = null) {
    return nonce ? Tip.findOne({ where: { url, nonce }, raw: true }) : Tip.findAll({ where: { url }, raw: true });
  }

};
