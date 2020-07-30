const AsyncLock = require('async-lock');
const LanguageDetector = require('languagedetect');

const LinkPreviewLogic = require('./linkPreviewLogic.js');
const aeternity = require('../utils/aeternity.js');
const Logger = require('../utils/logger');

const logger = new Logger('CacheLogic');
const lngDetector = new LanguageDetector();
const lock = new AsyncLock();

lngDetector.setLanguageType('iso2');

module.exports = class AsyncTipGeneratorsLogic {
  static async triggerGeneratePreviews(tips) {
    lock.acquire('AsyncTipGeneratorsLogic.triggerGeneratePreviews', async () => {
      const previews = await LinkPreviewLogic.fetchAllLinkPreviews();
      const tipUrls = [...new Set(tips.filter(tip => tip.url).map(tip => tip.url))];
      const previewUrls = [...new Set(previews.map(preview => preview.requestUrl))];

      const difference = tipUrls.filter(url => !previewUrls.includes(url));

      await difference.asyncMap(async url => {
        await LinkPreviewLogic.generatePreview(url).catch(logger.error);
      });
    });
  }

  static async triggerGetTokenContractIndex(tips) {
    return lock.acquire('AsyncTipGeneratorsLogic.triggerTokenContractIndex', async () => {
      const tokenContracts = tips.filter(t => t.token).map(t => t.token);
      const tokenRegistryContracts = await aeternity.getTokenRegistryState()
        .then(state => state.map(([token]) => token));

      return [...new Set(tokenContracts.concat(tokenRegistryContracts))]
        .reduce(async (promiseAcc, address) => {
          const acc = await promiseAcc;
          acc[address] = await aeternity.getTokenMetaInfoCacheAccounts(address);
          return acc;
        }, Promise.resolve({}));
    });
  }
};
