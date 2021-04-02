const cld = require('cld');
const AsyncLock = require('async-lock');
const { Op } = require('sequelize');

const aeternity = require('../../aeternity/logic/aeternity');
const {
  Tip, Retip, LinkPreview, Claim, ChainName, sequelize, Sequelize,
} = require('../../../models');
const NotificationLogic = require('../../notification/logic/notificationLogic');
const queueLogic = require('../../queue/logic/queueLogic');
const {
  COUNT_COMMENTS, AGGREGATION_VIEW, TOTAL_AMOUNT_FOR_ORDER, SCORE, URL_STATS_VIEW,
} = require('../utils/tipAggregation');
const { FILTER_BLACKLIST, FILTER_SIMILARITY_SUM } = require('../utils/tipFilter');
const { MESSAGES, MESSAGE_QUEUES } = require('../../queue/constants/queue');
const { topicsRegex } = require('../../aeternity/utils/tipTopicUtil');

const lock = new AsyncLock();

const PAGE_LIMIT = 30;
const awaitTips = {};
const awaitRetips = {};

const TipLogic = {
  init() {
    setTimeout(TipLogic.updateTipsDB, 5000);
    setTimeout(TipLogic.updateRetipsDB, 5000);
    setTimeout(TipLogic.updateClaimsDB, 5000);

    queueLogic.subscribeToMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.COMMANDS.UPDATE_DB, async message => {
      await TipLogic.updateTipsDB();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.TIPS, message.id);
    });
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.RETIPS, MESSAGES.RETIPS.COMMANDS.UPDATE_DB, async message => {
      await TipLogic.updateRetipsDB();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.RETIPS, message.id);
    });
  },

  orderByColumn(ordering) {
    switch (ordering) {
      case 'hot':
        return 'score';
      case 'latest':
        return 'timestamp';
      default:
        return '"totalAmountForOrder"';
    }
  },

  async fetchTips({
    page, blacklist, address, contractVersion, search, language, ordering,
  }) {
    const attributes = Object.keys(Tip.rawAttributes).concat([COUNT_COMMENTS, AGGREGATION_VIEW, URL_STATS_VIEW, TOTAL_AMOUNT_FOR_ORDER, SCORE]);
    const whereArguments = [];
    let order = sequelize.literal(`${TipLogic.orderByColumn(ordering)} DESC`);

    if (address) whereArguments.push({ sender: address });
    if (blacklist !== 'false') whereArguments.push({ id: FILTER_BLACKLIST });

    if (contractVersion) {
      const contractVersions = Array.isArray(contractVersion) ? contractVersion : [contractVersion];
      whereArguments.push({ contractId: { [Op.in]: contractVersions.map(aeternity.contractAddressForVersion) } });
    }

    if (language) {
      const languages = Array.isArray(language) ? language : [language];
      whereArguments.push({ language: { [Op.in]: languages } });
    }

    if (search) {
      const searchTopics = search.match(topicsRegex);
      if (searchTopics) {
        whereArguments.push({ topics: { [Op.overlap]: searchTopics } });
      } else {
        whereArguments.push(
          sequelize.where(
            FILTER_SIMILARITY_SUM(search),
            Op.gt,
            0.1,
          ),
        );

        attributes.push([FILTER_SIMILARITY_SUM(search), 'searchScore']);
        order = sequelize.literal('"searchScore" DESC');
      }
    }

    return Tip.findAll({
      attributes,
      include: [Retip, LinkPreview, Claim, ChainName],
      where: whereArguments,
      offset: ((page || 1) - 1) * PAGE_LIMIT,
      limit: PAGE_LIMIT,
      order,
    });
  },

  async fetchTip(id) {
    const attributes = Object.keys(Tip.rawAttributes).concat([COUNT_COMMENTS, AGGREGATION_VIEW, URL_STATS_VIEW, TOTAL_AMOUNT_FOR_ORDER, SCORE]);

    return Tip.findOne({
      attributes,
      include: [Retip, LinkPreview, Claim, ChainName],
      where: { id },
    });
  },

  async fetchAllLocalTips() {
    return Tip.findAll({ raw: true });
  },

  async fetchAllLocalTipsWithAggregation() {
    const attributes = Object.keys(Tip.rawAttributes).concat([AGGREGATION_VIEW, SCORE]);

    return Tip.findAll({
      attributes,
      raw: true,
    });
  },

  async fetchClaimedUrls() {
    return Tip.findAll({
      attributes: [sequelize.fn('DISTINCT', sequelize.col('Tip.url'))],
      where: { [Op.not]: sequelize.fn('unclaimed', sequelize.col('Tip.claimGen'), sequelize.col('Tip.url'), sequelize.col('Tip.contractId')) },
      raw: true,
    }).then(res => res.map(({ url }) => url));
  },

  async awaitTipsUpdated(id, retip) {
    if (retip) awaitRetips[id] = false;
    else awaitTips[id] = false;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject();
      }, 30000);

      function awaitLoop() {
        if (retip ? awaitRetips[id] : awaitTips[id]) return resolve();
        setTimeout(awaitLoop, 100);
      }

      setTimeout(awaitLoop, 0);
    });
  },

  async updateClaimsDB() {
    await lock.acquire('TipLogic.updateClaimsDB', async () => {
      const remoteClaims = (await aeternity.fetchStateBasic()).claims;
      const localClaims = await Claim.findAll({ raw: true });

      const insertOrUpdateClaims = remoteClaims.filter(r => {
        const notIncludesRemote = !localClaims.some(l => r.url === l.url && r.contractId === l.contractId);
        const includesRemoteUpdated = localClaims.some(l => r.url === l.url && r.contractId === l.contractId
          && (r.amount !== l.amount || r.claimGen !== l.claimGen));
        return includesRemoteUpdated || notIncludesRemote;
      });

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

      const inserted = await Tip.bulkCreate(result.map(({
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
      inserted.forEach(i => awaitTips[i.dataValues.id.includes('v1') ? null : i.dataValues.id] = true);

      if (inserted.length > 0) await queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.EVENTS.CREATED_NEW_LOCAL_TIPS);
      await queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.EVENTS.UPDATE_DB_FINISHED);
    });
  },

  async updateRetipsDB() {
    await lock.acquire('RetipLogic.updateRetipsDB', async () => {
      const remoteRetips = (await aeternity.fetchStateBasic()).retips;
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

      const retipsToInsert = newReTipIds.map(id => remoteRetips.find(({ id: retipId }) => id === retipId));

      const inserted = await Retip.bulkCreate(retipsToInsert);
      inserted.forEach(i => awaitRetips[i.dataValues.id.includes('v1') ? null : i.dataValues.id] = true);
    });
  },
};

module.exports = TipLogic;
