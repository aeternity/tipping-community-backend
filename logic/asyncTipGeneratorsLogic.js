const AsyncLock = require('async-lock');

const LinkPreviewLogic = require('./linkPreviewLogic.js');
const TipLogic = require('./tipLogic');
const RetipLogic = require('./retipLogic');
const logger = require('../utils/logger')(module);

const lock = new AsyncLock();

module.exports = class AsyncTipGeneratorsLogic {
  static async triggerGeneratePreviews(tips) {
    lock.acquire('AsyncTipGeneratorsLogic.triggerGeneratePreviews', async () => {
      const previews = await LinkPreviewLogic.fetchAllUrls();
      const tipUrls = [...new Set(tips.filter(tip => tip.url).map(tip => tip.url))];

      const difference = tipUrls.filter(url => !previews.includes(url));

      await difference.asyncMap(async url => {
        await LinkPreviewLogic.generatePreview(url).catch(logger.error);
      });
    });
  }

  static async triggerFetchAllLocalRetips(tips) {
    return lock.acquire('AsyncTipGeneratorsLogic.triggerTokenContractIndex', async () => {
      await TipLogic.updateTipsDB(tips);
      await RetipLogic.updateRetipsDB(tips);
    });
  }
};
