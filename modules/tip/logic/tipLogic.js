const cld = require('cld');
const AsyncLock = require('async-lock');
const { Op } = require('sequelize');

const aeternity = require('../../aeternity/logic/aeternity');
const {
  Tip, Retip, LinkPreview, Claim, sequelize,
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
const awaitTips = { v1: 0 };
const awaitRetips = { v1: 0 };

const includes = [
  { model: Retip, as: 'retips' },
  { model: LinkPreview, as: 'linkPreview' },
  { model: Claim, as: 'claim' },
];

const TipLogic = {
  init() {
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_TIPS_RETIPS_CLAIMS, async message => {
      await TipLogic.updateTipsRetipsClaimsDB();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, message.id);
    });

    queueLogic.subscribeToMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.COMMANDS.INSERT_TIP, async message => {
      if (message.payload) await TipLogic.insertTips([message.payload]);
      else await TipLogic.updateTipsRetipsClaimsDB(true);
      await queueLogic.deleteMessage(MESSAGE_QUEUES.TIPS, message.id);
    });

    queueLogic.subscribeToMessage(MESSAGE_QUEUES.RETIPS, MESSAGES.RETIPS.COMMANDS.INSERT_RETIP, async message => {
      if (message.payload) await TipLogic.insertRetips([message.payload]);
      else await TipLogic.updateTipsRetipsClaimsDB(true);
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
    let order = [sequelize.literal(`${TipLogic.orderByColumn(ordering)} DESC`)];

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
        order = [sequelize.literal('"searchScore" DESC')];
      }
    }

    order.push(sequelize.literal('"timestamp" DESC'));

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
      .then(tip => !!tip);
  },

  async checkRetipExists(id) {
    return Retip.findOne({ where: { id } })
      .then(retip => !!retip);
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

  getTipGen(id, retip) {
    return (retip ? awaitRetips[id] : awaitTips[id]) || 0;
  },

  async awaitTipsUpdated(id, retip) {
    const baseGen = TipLogic.getTipGen(id, retip);
    if (id !== 'v1') {
      const exists = retip ? await TipLogic.checkRetipExists(id) : await TipLogic.checkTipExists(id);
      if (exists) return null;
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject();
      }, 30000);

      function awaitLoop() {
        // check if the wait should be resolved
        if (TipLogic.getTipGen(id, retip) > baseGen) {
          return resolve();
        }
        return setTimeout(awaitLoop, 100);
      }
      awaitLoop();
    });
  },

  async updateTipsRetipsClaimsDB(onlyV1 = false) {
    const basicState = await aeternity.fetchStateBasic(onlyV1);
    await TipLogic.updateTipsDB(basicState.tips);
    await TipLogic.updateRetipsDB(basicState.retips);
    await TipLogic.updateClaimsDB(basicState.claims);
  },

  async insertClaims(claimsToInsert) {
    const insertedClaims = await Claim.bulkCreate(claimsToInsert, { updateOnDuplicate: ['claimGen', 'amount', 'updatedAt'] });
    await insertedClaims.asyncMap(NotificationLogic.handleClaim);
    return insertedClaims;
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
      if (i.dataValues.id.includes('v1')) {
        awaitTips.v1++;
      } else {
        awaitTips[i.dataValues.id] = 1;
      }
    });

    await inserted.asyncMap(NotificationLogic.handleNewTip);

    if (inserted.length > 0) await queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.EVENTS.CREATED_NEW_LOCAL_TIPS);
  },

  async updateTipsDB(remoteTips) {
    await lock.acquire('TipLogic.updateTipsDB', async () => {
      const localTips = await Tip.findAll({ raw: true });
      const localTipIds = [...new Set(localTips.map(tip => tip.id))];

      const newTips = remoteTips.filter(({ id }) => !localTipIds.includes(id));

      const result = await newTips.asyncMap(async tip => {
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
      if (i.dataValues.id.includes('v1')) {
        awaitRetips.v1++;
      } else {
        awaitRetips[i.dataValues.id] = 1;
      }
    });

    await inserted.asyncMap(NotificationLogic.handleNewRetip);
  },

  async updateRetipsDB(remoteRetips) {
    await lock.acquire('RetipLogic.updateRetipsDB', async () => {
      const localRetips = await Retip.findAll({ raw: true });
      const localRetipIds = [...new Set(localRetips.map(retip => retip.id))];

      const newReTips = remoteRetips.filter(({ id }) => !localRetipIds.includes(id));

      await TipLogic.insertRetips(newReTips);
    });
  },
};

module.exports = TipLogic;
