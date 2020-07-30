const AsyncLock = require('async-lock');
const LanguageDetector = require('languagedetect');

const cld = require('cld');
const LinkPreviewLogic = require('./linkPreviewLogic.js');
const RetipLogic = require('./retipLogic');
const NotificationLogic = require('./notificationLogic');
const TipLogic = require('./tipLogic');
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

  static async triggerLanguageDetection(tips) {
    lock.acquire('AsyncTipGeneratorsLogic.triggerLanguageDetection', async () => {
      const languages = await TipLogic.fetchAllLocalTips();
      const tipIds = [...new Set(tips.map(tip => tip.id))];
      const languageIds = [...new Set(languages.map(preview => preview.id))];

      const difference = tipIds.filter(url => !languageIds.includes(url));

      const result = await difference.asyncMap(async id => {
        let { title } = tips.find(tip => tip.id === id);
        title = title.replace(/[!0-9#.,?)-:'“@/\\]/g, '');
        // const probability = lngDetector.detect(title, 1);
        const probability2 = await cld.detect(title).catch(() => ({}));
        // const lang1 = probability[0] ? probability[0][0] !== null ? probability[0][0] : null : null;
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
    await lock.acquire('AsyncTipGeneratorsLogic.fetchAllLocalRetips', async () => {
      const localRetips = await RetipLogic.fetchAllLocalRetips();
      const remoteRetips = [...new Set(tips.map(tip => tip.retips.map(retip => ({ ...retip, parentTip: tip }))).flat())];
      const remoteRetipIds = [...new Set(remoteRetips.map(retip => retip.id))];
      const localRetipIds = [...new Set(localRetips.map(retip => retip.id))];

      const difference = remoteRetipIds.filter(id => !localRetipIds.includes(id));

      // Send appropriate notifications for new tips
      await difference.asyncMap(id => NotificationLogic.handleNewRetip(remoteRetips.find(retip => retip.id === id)));
    });
  }
};
