const AsyncLock = require('async-lock');
const cld = require('cld');

const LinkPreviewLogic = require('./linkPreviewLogic.js');
const TipLogic = require('./tipLogic');
const RetipLogic = require('./retipLogic');
const aeternity = require('../utils/aeternity.js');
const logger = require('../utils/logger')(module);

const lock = new AsyncLock();

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

  static async triggerLanguageDetection(tips) {
    lock.acquire('AsyncTipGeneratorsLogic.triggerLanguageDetection', async () => {
      const languages = await TipLogic.fetchAllLocalTips();
      const tipIds = [...new Set(tips.map(tip => tip.id))];
      const languageIds = [...new Set(languages.map(preview => preview.id))];

      const difference = tipIds.filter(url => !languageIds.includes(url));

      const result = await difference.asyncMap(async id => {
        const tip = tips.find(({ id: tipId }) => tipId === id);
        const title = tip.title.replace(/[!0-9#.,?)-:'“@/\\]/g, '');
        const probability2 = await cld.detect(title).catch(() => ({}));
        const lang2 = probability2.languages ? probability2.languages[0].code : null;
        return { id, lang2, title };
      });

      await TipLogic.bulkCreate(result.map(({ id, lang2 }) => ({
        id,
        language: lang2,
      })));
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

  static async triggerFetchAllLocalRetips(tips) {
    return lock.acquire('AsyncTipGeneratorsLogic.triggerTokenContractIndex', async () => {
      await TipLogic.updateTipsDB(tips);
      await RetipLogic.updateRetipsDB(tips);
    });
  }
};
