import sequelize from "sequelize";
import AsyncLock from "async-lock";
import models from "../../../models/index.js";
import MdwLogic from "../../aeternity/logic/mdwLogic.js";
import aeternity from "../../aeternity/logic/aeternity.js";
import { MESSAGE_QUEUES, MESSAGES } from "../../queue/constants/queue.js";
import queueLogic from "../../queue/logic/queueLogic.js";
import { EVENT_TYPES } from "../constants/eventTypes.js";
import loggerFactory from "../../../utils/logger.js";
// retrieve events from database
const { Op } = sequelize;
const { Event } = models;
const logger = loggerFactory(import.meta.url);
const lockNoTimeout = new AsyncLock();
const EventLogic = {
    init() {
        // subscribe to chain listener
        queueLogic.subscribeToMessage(MESSAGE_QUEUES.BLOCKCHAIN, MESSAGES.BLOCKCHAIN.EVENTS.EVENT_RECEIVED, async ({ payload, id }) => {
            await EventLogic.writeEventToDB(payload.event);
            await EventLogic.sendMessages(payload);
            await queueLogic.deleteMessage(MESSAGE_QUEUES.BLOCKCHAIN, id);
        });
        queueLogic.subscribeToMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_EVENTS, async ({ id }) => {
            await EventLogic.updateDatabaseAndClearForks();
            await queueLogic.deleteMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, id);
        });
    },
    async getAllEvents(address, eventName, limit) {
        return Event.findAll({
            where: {
                ...(typeof address !== 'undefined') && {
                    addresses: {
                        [Op.contains]: [address],
                    },
                },
                ...(typeof eventName !== 'undefined') && {
                    name: eventName,
                },
            },
            order: [
                ['height', 'DESC'],
                ['time', 'DESC'],
                ['nonce', 'DESC'],
            ],
            limit: limit || null,
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
            case EVENT_TYPES.TIP_RECEIVED:
                // NEW TOKEN TIP
                await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.TIP_RECEIVED, event.contract === process.env.CONTRACT_V2_ADDRESS ? await aeternity.getTipV2(tx.returnValue) : null);
                break;
            case EVENT_TYPES.TIP_TOKEN_RECEIVED:
                // NEW TOKEN TIP
                await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.TIP_RECEIVED, await aeternity.getTipV2(tx.returnValue));
                break;
            case EVENT_TYPES.POST_WITHOUT_TIP_RECEIVED:
                // NEW TOKEN TIP
                await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.TIP_RECEIVED, await aeternity.getTipV3(tx.returnValue));
                break;
            case EVENT_TYPES.POST_VIA_BURN_RECEIVED:
                // NEW TOKEN TIP
                await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.TIP_RECEIVED, await aeternity.getTipV4(tx.returnValue));
                break;
            case EVENT_TYPES.RETIP_RECEIVED:
                // NEW RETIP
                await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.RETIP_RECEIVED, event.contract === process.env.CONTRACT_V2_ADDRESS ? await aeternity.getRetipV2(tx.returnValue) : null);
                break;
            case EVENT_TYPES.RETIP_TOKEN_RECEIVED:
                // NEW TOKEN RETIP
                await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.RETIP_RECEIVED, await aeternity.getRetipV2(tx.returnValue));
                break;
            case EVENT_TYPES.TIP_WITHDRAWN:
                // CLAIM
                await queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.TIP_WITHDRAWN, await aeternity.getClaimV1V2(event.contract, event.url));
                break;
            case EVENT_TYPES.QUERY_ORACLE:
                // ORACLE HAS RECEIVED A QUERY
                break;
            case EVENT_TYPES.CHECK_PERSIST_CLAIM:
                // ORACLE CHECKED CLAIM
                break;
            case EVENT_TYPES.TRANSFER:
                // TRANSFER AEX9
                break;
            case EVENT_TYPES.ALLOWANCE:
                // ALLOWANCE AEX9
                break;
            default:
                logger.warn('Unknown event:');
                logger.warn(event);
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
            // go from current to the lowest height
            const newEvents = await MdwLogic.middlewareContractTransactions(currentHeight, maxHeightInDB + 1);
            return Event.bulkCreate(newEvents.map(event => EventLogic.prepareEventForDB(event)));
        });
    },
};
export default EventLogic;
