import queueLogic from "./queueLogic.js";
import { MESSAGES, MESSAGE_QUEUES } from "../constants/queue.js";

const msInMin = 60 * 1000;
const scheduledEvents = [
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.CACHE_KEEPHOT, interval: process.env.KEEP_HOT_INTERVAL || 5 * msInMin, onceAtStartup: true },
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_CHAIN_NAMES, interval: 10 * msInMin, onceAtStartup: true },
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_TIPS_RETIPS_CLAIMS, interval: 10 * msInMin, onceAtStartup: true },
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_EVENTS, interval: 10 * msInMin, onceAtStartup: true },
  { message: MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_LINKPREVIEWS, interval: 60 * msInMin, onceAtStartup: true },
];
const SchedulerLogic = {
  init() {
    scheduledEvents.forEach(async ({ message, interval, onceAtStartup }) => {
      if (onceAtStartup) await queueLogic.sendMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, message);
      setInterval(() => queueLogic.sendMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, message), interval);
    });
  },
};
export default SchedulerLogic;
