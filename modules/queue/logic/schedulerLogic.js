const queueLogic = require('./queueLogic');
const { MESSAGES, MESSAGE_QUEUES } = require('../constants/queue');

const msInMin = 60 * 1000;

const scheduledEvents = [
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.CACHE_KEEPHOT, interval: process.env.KEEP_HOT_INTERVAL || 5 * msInMin, onceAtStartup: true },
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_CHAIN_NAMES, interval: 10 * msInMin, onceAtStartup: true },
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_TIPS_RETIPS_CLAIMS, interval: 10 * msInMin, onceAtStartup: true },
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_EVENTS, interval: 10 * msInMin, onceAtStartup: true },
];

const SchedulerLogic = {
  init() {
    setTimeout(() => scheduledEvents.forEach(async ({ message, interval, onceAtStartup }) => {
      if (onceAtStartup) await queueLogic.sendMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, message);
      setInterval(() => queueLogic.sendMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, message), interval);
    }), 1000);
  },
};

module.exports = SchedulerLogic;
