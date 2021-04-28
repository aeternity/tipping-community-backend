const cld = require('cld');
const AsyncLock = require('async-lock');
const { Op } = require('sequelize');

const aeternity = require('../../aeternity/logic/aeternity');
const {
  Tip, Retip, LinkPreview, Claim, ChainName, sequelize,
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

const includes = [
  { model: Retip, as: 'retips' },
  { model: LinkPreview, as: 'linkPreview' },
  { model: Claim, as: 'claim' },
  { model: ChainName, as: 'chainName' }];

const TipLogic = {
  init() {
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_TIPS_RETIPS_CLAIMS, async message => {
      await TipLogic.updateTipsRetipsClaimsDB();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, message.id);
    });

    queueLogic.subscribeToMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.COMMANDS.INSERT_TIP, async message => {
      if (message.payload) await TipLogic.insertTips([message.payload]);
      await queueLogic.deleteMessage(MESSAGE_QUEUES.TIPS, message.id);
    });

    queueLogic.subscribeToMessage(MESSAGE_QUEUES.RETIPS, MESSAGES.RETIPS.COMMANDS.INSERT_RETIP, async message => {
      if (message.payload) await TipLogic.insertRetips([message.payload]);
      await queueLogic.deleteMessage(MESSAGE_QUEUES.RETIPS, message.id);
    });

    queueLogic.subscribeToMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.COMMANDS.INSERT_CLAIM, async message => {
      await TipLogic.insertClaims([message.payload]);
      await queueLogic.deleteMessage(MESSAGE_QUEUES.TIPS, message.id);
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
    if (blacklist !== false) whereArguments.push({ id: FILTER_BLACKLIST });

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
      include: includes,
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
      include: includes,
      where: { id },
    });
  },

  async checkTipExists(id) {
    return Tip.findOne({ where: { id } })
      .then(id => !!id);
  },

  async checkRetipExists(id) {
    return Retip.findOne({ where: { id } })
      .then(id => !!id);
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

  async awaitTipsUpdated(id, retip) {
    const exists = retip ? await TipLogic.checkRetipExists(id) : await TipLogic.checkTipExists(id);
    if (exists) return;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject();
      }, 30000);

      // eslint-disable-next-line consistent-return
      function awaitLoop() {
        if (retip ? awaitRetips[id] : awaitTips[id]) return resolve();
        setTimeout(awaitLoop, 100);
      }

      setTimeout(awaitLoop, 0);
    });
  },

  async updateTipsRetipsClaimsDB() {
    const basicState = await aeternity.fetchStateBasic();
    await TipLogic.updateTipsDB(basicState.tips);
    await TipLogic.updateRetipsDB(basicState.retips);
    await TipLogic.updateClaimsDB(basicState.claims);
  },

  async insertClaims(claimsToInsert) {
    return Claim.bulkCreate(claimsToInsert, { updateOnDuplicate: ['claimGen', 'amount', 'updatedAt'] });
  },

  async updateClaimsDB(remoteClaims) {
    await lock.acquire('TipLogic.updateClaimsDB', async () => {
      const localClaims = await Claim.findAll({ raw: true });

      const insertOrUpdateClaims = remoteClaims.filter(r => {
        const notIncludesRemote = !localClaims.some(l => r.url === l.url && r.contractId === l.contractId);
        const includesRemoteUpdated = localClaims.some(l => r.url === l.url && r.contractId === l.contractId
          && (r.amount !== l.amount || r.claimGen !== l.claimGen));
        return includesRemoteUpdated || notIncludesRemote;
      });

      await TipLogic.insertClaims(insertOrUpdateClaims);
    });
  },

  async insertTips(tipsToInsert) {
    const inserted = await Tip.bulkCreate(tipsToInsert);

    inserted.forEach(i => {
      awaitTips[i.dataValues.id.includes('v1') ? null : i.dataValues.id] = true;
    });

    if (inserted.length > 0) await queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.EVENTS.CREATED_NEW_LOCAL_TIPS);
  },

  async updateTipsDB(remoteTips) {
    await lock.acquire('TipLogic.updateTipsDB', async () => {
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
        const language = probability.languages ? probability.languages[0].code : null;
        return { ...tip, language };
      });

      await TipLogic.insertTips(result);
    });
  },

  async insertRetips(retipsToInsert) {
    const inserted = await Retip.bulkCreate(retipsToInsert);
    inserted.forEach(i => {
      awaitRetips[i.dataValues.id.includes('v1') ? null : i.dataValues.id] = true;
    });
  },

  async updateRetipsDB(remoteRetips) {
    await lock.acquire('RetipLogic.updateRetipsDB', async () => {
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
      await TipLogic.insertRetips(retipsToInsert);
    });
  },
};

module.exports = TipLogic;
