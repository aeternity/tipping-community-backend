// retrieve events from database
const { Op } = require('sequelize');
const { Event } = require('../../../models');
const MdwLogic = require('../../aeternity/logic/mdwLogic');
const aeternity = require('../../aeternity/logic/aeternity');
const { MESSAGE_QUEUES, MESSAGES } = require('../../queue/constants/queue');
const queueLogic = require('../../queue/logic/queueLogic');

const EventLogic = {
  async init() {
    // subscribe to chain listener
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.CHECK_PERSIST_CLAIM);
  },

  async getEventsFromDB(relevantAddresses) {
    return Event.findAll({
      where: {
        addresses: relevantAddresses,
      },
    });
  },
  async writeEventToDB(event) {
    return Event.create(EventLogic.prepareEventForDB(event));
  },
  async prepareEventForDB(event) {
    return {
      ...event,
      addresses: [
        ...(typeof event.address !== 'undefined') && [event.address],
        ...(typeof event.from !== 'undefined') && [event.from],
        ...(typeof event.to !== 'undefined') && [event.to],
        ...(typeof event.receiver !== 'undefined') && [event.receiver],
        ...(typeof event.caller !== 'undefined') && [event.caller],
      ],
    };
  },
  async updateDatabaseAndClearForks() {
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
    const maxHeightInDB = await Event.max('height') ?? 0;
    // go from current to lowest height
    const newEvents = await MdwLogic.middlewareContractTransactions(currentHeight, maxHeightInDB + 1);
    await Event.bulkInsert(newEvents.map(event => EventLogic.prepareEventForDB(event)));
  },
};

module.exports = EventLogic;
