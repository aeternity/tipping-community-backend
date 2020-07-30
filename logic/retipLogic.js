const AsyncLock = require('async-lock');
const { Retip } = require('../models');
const NotificationLogic = require('./notificationLogic');

const lock = new AsyncLock();

module.exports = class RetipLogic {
  static async fetchAllLocalRetips() {
    return Retip.findAll({ raw: true });
  }

  static async bulkCreate(tips) {
    return Retip.bulkCreate(tips, { raw: true });
  }

  static async updateRetipsDB(remoteTips) {
    await lock.acquire('RetipLogic.updateRetipsDB', async () => {
      const localRetips = await RetipLogic.fetchAllLocalRetips();
      const remoteRetips = [...new Set(remoteTips.map(tip => tip.retips.map(retip => ({
        ...retip,
        parentTip: tip,
      }))).flat())];
      const remoteRetipIds = [...new Set(remoteRetips.map(retip => retip.id))];
      const localRetipIds = [...new Set(localRetips.map(retip => retip.id))];

      const newReTipIds = remoteRetipIds.filter(id => !localRetipIds.includes(id));
      const oldReTipIds = remoteRetipIds.filter(id => localRetipIds.includes(id));

      // Send appropriate notifications for new tips
      await newReTipIds.asyncMap(id => NotificationLogic.handleNewRetip(remoteRetips.find(retip => retip.id === id)));
      await oldReTipIds.asyncMap(id => NotificationLogic.handleOldRetip(remoteRetips.find(retip => retip.id === id)));

      await RetipLogic.bulkCreate(
        newReTipIds.map(id => remoteRetips.find(({ id: retipId }) => id === retipId))
          .map(({ id, parentTip, claim }) => ({ id, tipId: parentTip.id, unclaimed: claim.unclaimed })),
      );
    });
  }
};
