// retrieve events from database
const { Op } = require('sequelize');
const AsyncLock = require('async-lock');
const { Event } = require('../../../models');
const MdwLogic = require('../../aeternity/logic/mdwLogic');
const aeternity = require('../../aeternity/logic/aeternity');
const { MESSAGE_QUEUES, MESSAGES } = require('../../queue/constants/queue');
const queueLogic = require('../../queue/logic/queueLogic');
const logger = require('../../../utils/logger')(module);

const lockNoTimeout = new AsyncLock();

const EventLogic = {
  init() {
    // subscribe to chain listener
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.BLOCKCHAIN, MESSAGES.BLOCKCHAIN.EVENTS.EVENT_RECEIVED, async ({ payload, id }) => {
      await EventLogic.writeEventToDB(payload.event);
      await EventLogic.sendMessages(payload);
      await queueLogic.deleteMessage(MESSAGE_QUEUES.BLOCKCHAIN, id);
    });
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.COMMANDS.KEEPHOT, async ({ id }) => {
      await EventLogic.updateDatabaseAndClearForks();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.EVENTS, id);
    });
  },

  async getEventsForURL(url) {
    return Event.findAll({
      where: { url },
    });
  },

  async getEventsForAddresses(relevantAddresses) {
    return Event.findAll({
      where: {
        addresses: {
          [Op.contains]: relevantAddresses,
        },
      },
    });
  },

  async sendMessages({ event, tx }) {
    switch (event.name) {
      case 'TipReceived':
        // NEW TOKEN TIP
        await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.TIP_RECEIVED, await aeternity.getTipV2(tx.returnValue));
        break;
      case 'TipTokenReceived':
        // NEW TOKEN TIP
        await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.TIP_RECEIVED, await aeternity.getTipV2(tx.returnValue));
        break;
      case 'ReTipReceived':
        // NEW RETIP
        await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.RETIP_RECEIVED, await aeternity.getRetipV2(tx.returnValue));
        break;
      case 'ReTipTokenReceived':
        // NEW TOKEN RETIP
        await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.RETIP_RECEIVED, await aeternity.getRetipV2(tx.returnValue));
        break;
      case 'TipWithdrawn':
        // CLAIM
        await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.TIP_WITHDRAWN);
        break;
      case 'QueryOracle':
        // ORACLE HAS RECEIVED A QUERY
        break;
      case 'CheckPersistClaim':
        // ORACLE CHECKED CLAIM
        break;
      case 'Transfer':
        // TRANSFER AEX9
        break;
      case 'Allowance':
        // ALLOWANCE AEX9
        break;
      default:
        logger.info('Unknown event:');
        logger.info(event);
    }
  },

  async writeEventToDB(event) {
    return Event.create(EventLogic.prepareEventForDB(event));
  },

  prepareEventForDB(event) {
    return {
      ...event,
      addresses: [
        event.address,
        event.from,
        event.to,
        event.receiver,
        event.caller,
        // deduplicate & check for existence
      ].filter((v, i, a) => v && a.indexOf(v) === i),
    };
  },

  async updateDatabaseAndClearForks() {
    return lockNoTimeout.acquire('eventLogic.updateDatabaseAndClearForks', async () => {
      // fetch events from middleware
      const currentHeight = await aeternity.getHeight();
      // clear last 20 blocks
      await Event.destroy({
        where: {
          height: {
            [Op.gt]: currentHeight - 20,
          },
        },
      });

      // get events until we hit db
      const maxHeightInDB = await Event.max('height') || 0;
      // go from current to lowest height
      const newEvents = await MdwLogic.middlewareContractTransactions(currentHeight, maxHeightInDB + 1);
      return Event.bulkCreate(newEvents.map(event => EventLogic.prepareEventForDB(event)));
    });
  },
};

module.exports = EventLogic;
