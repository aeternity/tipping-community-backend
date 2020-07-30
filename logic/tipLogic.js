const cld = require('cld');
const AsyncLock = require('async-lock');

const { Tip } = require('../models');
const NotificationLogic = require('./notificationLogic');

const lock = new AsyncLock();

module.exports = class TipLogic {
  static async fetchAllLocalTips() {
    return Tip.findAll({ raw: true });
  }

  static async bulkCreate(tips) {
    return Tip.bulkCreate(tips, { raw: true });
  }

  static async updateTipsDB(remoteTips) {
    await lock.acquire('TipLogic.updateTipsDB', async () => {
      const localTips = await TipLogic.fetchAllLocalTips();
      const remoteTipIds = [...new Set(remoteTips.map(tip => tip.id))];
      const localTipIds = [...new Set(localTips.map(tip => tip.id))];

      const newTipsIds = remoteTipIds.filter(id => !localTipIds.includes(id));
      const oldTipsIds = remoteTipIds.filter(id => localTipIds.includes(id));

      // Send appropriate notifications for new tips
      await newTipsIds.asyncMap(id => NotificationLogic.handleNewTip(remoteTips.find(tip => tip.id === id)));
      await oldTipsIds.asyncMap(id => NotificationLogic.handleOldTip(remoteTips.find(tip => tip.id === id)));

      const result = await newTipsIds.asyncMap(async id => {
        const tip = remoteTips.find(t => t.id === id);
        let { title } = tip;
        title = title.replace(/[!0-9#.,?)-:'“@/\\]/g, '');
        const probability = await cld.detect(title).catch(() => ({}));
        const lang = probability.languages ? probability.languages[0].code : null;
        return { ...tip, lang };
      });
      await TipLogic.bulkCreate(result.map(({ id, lang, claim }) => ({
        id,
        language: lang,
        unclaimed: claim.unclaimed,
      })));
    });
  }
};
