const cld = require('cld');
const AsyncLock = require('async-lock');
const aeternity = require('../../aeternity/logic/aeternity');

const { Tip, Retip, LinkPreview, Claim } = require('../../../models');
const NotificationLogic = require('../../notification/logic/notificationLogic');
const queueLogic = require('../../queue/logic/queueLogic');
const { COUNT_COMMENTS, AGGREGATION_VIEW, SCORE } = require('../utils/tipAggregation');
const { FILTER_BLACKLIST } = require('../utils/tipFilter');
const { MESSAGES, MESSAGE_QUEUES } = require('../../queue/constants/queue');

const lock = new AsyncLock();

const dbFetchAttributes = {
  attributes: Object.keys(Tip.rawAttributes).concat([COUNT_COMMENTS, AGGREGATION_VIEW, SCORE]),
  include: [Retip, LinkPreview, Claim],
}

const PAGE_LIMIT = 30;

const TipLogic = {
  init() {
    setTimeout(TipLogic.updateTipsDB, 5000);
    setTimeout(this.updateRetipsDB, 5000);
    setTimeout(this.updateClaimsDB, 5000);

    queueLogic.subscribeToMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.COMMANDS.UPDATE_DB, async message => {
      await TipLogic.updateTipsDB();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.TIPS, message.id);
    });
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.RETIPS, MESSAGES.RETIPS.COMMANDS.UPDATE_DB, async message => {
      await TipLogic.updateRetipsDB();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.RETIPS, message.id);
    });
  },

  async fetchTips({ page, blacklist, address, contractVersion, search, language, ordering }) {
    const whereArguments = []

    if (address) whereArguments.push({ sender: address });
    if (blacklist !== 'false') whereArguments.push({ id: FILTER_BLACKLIST })

    return Tip.findAll({
      ...dbFetchAttributes,
      where: whereArguments,
      offset: ((page || 1) - 1) * PAGE_LIMIT,
      limit: PAGE_LIMIT,
    });
  },

  async updateClaimsDB() {
    await lock.acquire('TipLogic.updateClaimsDB', async () => {
      const remoteClaims = (await aeternity.fetchStateBasic()).claims;
      const localClaims = await Claim.findAll({ raw: true });

      const insertOrUpdateClaims = remoteClaims.filter(r => {
        const notIncludesRemote = !localClaims.some(l => r.url === l.url && r.contractId === l.contractId);
        const includesRemoteUpdated = localClaims.some(l => r.url === l.url && r.contractId === l.contractId && (r.amount !== l.amount || r.claimGen !== l.claimGen));
        return includesRemoteUpdated || notIncludesRemote;
      })

      await Claim.bulkCreate(insertOrUpdateClaims, { updateOnDuplicate: ['claimGen', 'amount', 'updatedAt'] });
    });
  },

  async updateTipsDB() {
    await lock.acquire('TipLogic.updateTipsDB', async () => {
      const remoteTips = (await aeternity.fetchStateBasic()).tips;
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
        const titleToDetect = tip.title.replace(/[!0-9#.,?)-:'“@/\\]/g, '');
        const probability = await cld.detect(titleToDetect).catch(() => ({}));
        const lang = probability.languages ? probability.languages[0].code : null;
        return { ...tip, lang };
      });

      await Tip.bulkCreate(result.map(({
        id, lang, sender, media, url, topics, title, token, tokenAmount, amount, claimGen, type, contractId, timestamp,
      }) => ({
        id: String(id),
        language: lang,
        sender,
        media: media || [],
        url,
        topics,
        title,
        token,
        tokenAmount,
        amount,
        claimGen,
        type,
        contractId,
        timestamp,
      })));
      if (newTipsIds.length > 0) {
        await queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.EVENTS.CREATED_NEW_LOCAL_TIPS);
      }
      await queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.EVENTS.UPDATE_DB_FINISHED);
    });
  },

  async updateRetipsDB() {
    await lock.acquire('RetipLogic.updateRetipsDB', async () => {
      const remoteRetips = (await aeternity.fetchStateBasic()).retips
      const localRetips = await Retip.findAll({ raw: true });
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

      const retipsToInsert = newReTipIds.map(id => remoteRetips.find(({id: retipId}) => id === retipId));
      await Retip.bulkCreate(retipsToInsert);
    });
  },
};

module.exports = TipLogic;
