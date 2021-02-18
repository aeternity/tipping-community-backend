const cld = require('cld');
const AsyncLock = require('async-lock');
const CacheLogic = require('../../cache/logic/cacheLogic');

const { Tip, Retip } = require('../../../models');
const NotificationLogic = require('../../notification/logic/notificationLogic');
const queueLogic = require('../../queue/logic/queueLogic');
const { MESSAGES, MESSAGE_QUEUES } = require('../../queue/constants/queue');

const lock = new AsyncLock();

class TipLogic {
  constructor() {
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.COMMANDS.UPDATE_DB, async message => {
      await this.updateTipsDB();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.TIPS, message.id);
    });
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.RETIPS, MESSAGES.RETIPS.COMMANDS.UPDATE_DB, async message => {
      await this.updateRetipsDB();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.RETIPS, message.id);
    });
  }

  async fetchTips(page) {
    const limit = 30;

    if (page) {
      return Tip.findAll({
        offset: (page - 1) * limit,
        limit: limit
      })
    }

    return TipLogic.fetchAllLocalTips();
  }

  async fetchAllLocalTips() {
    return Tip.findAll({ raw: true });
  }

  async fetchAllLocalRetips() {
    return Retip.findAll({ raw: true });
  }

  async updateTipsDB() {
    await lock.acquire('TipLogic.updateTipsDB', async () => {
      const remoteTips = await CacheLogic.getTips();
      const localTips = await Tip.findAll({ raw: true });
      const remoteTipIds = [...new Set(remoteTips.map(tip => tip.id))];
      const localTipIds = [...new Set(localTips.map(tip => tip.id))];

      const newTipsIds = remoteTipIds.filter(id => !localTipIds.includes(id));
      const oldTipsIds = remoteTipIds.filter(id => localTipIds.includes(id));

      // Send appropriate notifications for new tips
      await newTipsIds.asyncMap(id => NotificationLogic.handleNewTip(remoteTips.find(tip => tip.id === id)));
      await oldTipsIds.asyncMap(id => NotificationLogic.handleOldTip(
        localTips.find(tip => tip.id === id),
        remoteTips.find(tip => tip.id === id),
      ));

      const result = await newTipsIds.asyncMap(async id => {
        const tip = remoteTips.find(t => t.id === id);
        let { title } = tip;
        title = title.replace(/[!0-9#.,?)-:'“@/\\]/g, '');
        const probability = await cld.detect(title).catch(() => ({}));
        const lang = probability.languages ? probability.languages[0].code : null;
        return { ...tip, lang };
      });
      await Tip.bulkCreate(result.map(({
        id, lang, claim, sender, media,
      }) => ({
        id: String(id),
        language: lang,
        sender,
        unclaimed: claim ? claim.unclaimed : false,
        media: media || [],
      })));
      if (newTipsIds.length > 0) {
        await queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.EVENTS.CREATED_NEW_LOCAL_TIPS);
      }
      await queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.EVENTS.UPDATE_DB_FINISHED);
    });
  }

  async updateRetipsDB() {
    await lock.acquire('RetipLogic.updateRetipsDB', async () => {
      const remoteTips = await CacheLogic.getTips();
      const localRetips = await this.fetchAllLocalRetips();
      const remoteRetips = [...(remoteTips.map(tip => tip.retips.map(retip => ({
        ...retip,
        parentTip: tip,
      }))).flat())];
      const remoteRetipIds = [...new Set(remoteRetips.map(retip => retip.id))];
      const localRetipIds = [...new Set(localRetips.map(retip => retip.id))];

      const newReTipIds = remoteRetipIds.filter(id => !localRetipIds.includes(id));
      const oldReTipIds = remoteRetipIds.filter(id => localRetipIds.includes(id));

      // Send appropriate notifications for new tips
      await newReTipIds.asyncMap(id => NotificationLogic.handleNewRetip(remoteRetips.find(retip => retip.id === id)));
      await oldReTipIds.asyncMap(id => NotificationLogic.handleOldRetip(
        localRetips.find(retip => retip.id === id),
        remoteRetips.find(retip => retip.id === id),
      ));

      await Retip.bulkCreate(
        newReTipIds.map(id => remoteRetips.find(({ id: retipId }) => id === retipId))
          .map(({
            id, parentTip, claim, sender,
          }) => ({
            id, tipId: parentTip.id, unclaimed: claim.unclaimed, sender,
          })),
      );
    });
  }
}

const tipLogic = new TipLogic();
module.exports = tipLogic;
