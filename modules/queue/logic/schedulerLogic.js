const queueLogic = require('./queueLogic');
const { MESSAGES, MESSAGE_QUEUES } = require('../constants/queue');

const msInMin = 60 * 1000;

const scheduledEvents = [
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.CACHE_KEEPHOT, interval: process.env.KEEP_HOT_INTERVAL || 5 * msInMin, onceAtStartup: false },
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_CHAIN_NAMES, interval: 15 * msInMin, onceAtStartup: false }, // 10
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_TIPS_RETIPS_CLAIMS, interval: 9 * msInMin, onceAtStartup: false }, // 10
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_EVENTS, interval: 12 * msInMin, onceAtStartup: false }, // 10
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_LINKPREVIEWS, interval: 60 * msInMin, onceAtStartup: false },
];

const SchedulerLogic = {
  init() {
    scheduledEvents.forEach(async ({ message, interval, onceAtStartup }) => {
      if (onceAtStartup) await queueLogic.sendMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, message);
      setInterval(() => queueLogic.sendMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, message), interval);
    });
  },
};

module.exports = SchedulerLogic;
