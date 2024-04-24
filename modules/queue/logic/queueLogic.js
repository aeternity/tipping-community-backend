import operators from "rxjs/operators";
import RedisSMQ from "rsmq";
import rxjs from "rxjs";
import redis from "redis";
import loggerFactory from "../../../utils/logger.js";
import { MESSAGE_QUEUES, MESSAGES } from "../constants/queue.js";
const { filter } = operators;
const { Subject } = rxjs;
const logger = loggerFactory(import.meta.url);
const publisher = redis.createClient(`redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`);
const subscriber = redis.createClient(`redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`);
const MQ_NAMESPACE = "rsmq";
const rsmq = new RedisSMQ({
  client: publisher,
  ns: MQ_NAMESPACE,
  realtime: true,
});
let queues = [];
const QueueLogic = {
  async init() {
    // Create initial subjects
    Object.values(MESSAGE_QUEUES).map((qname) => QueueLogic.initQueueSubject(qname));
    subscriber.on("message", (channel) => QueueLogic.notifySubscriber(channel));
    logger.info("All MQs registered locally");
    await Promise.all(Object.values(MESSAGE_QUEUES).map((qname) => QueueLogic.createQueue(qname).catch((e) => logger.error(e))));
    logger.info("All MQs registered on redis");
  },
  getQueues() {
    return queues;
  },
  async getAllMessages(qname) {
    let fetchSuccess = true;
    const allMessages = [];
    while (fetchSuccess) {
      // eslint-disable-next-line no-await-in-loop
      const message = await QueueLogic.receiveMessage(qname).catch((e) => logger.warn(`Reading queue ${qname} failed with ${e.message}`));
      fetchSuccess = message && message.id;
      if (fetchSuccess) {
        allMessages.push(message);
      }
    }
    return allMessages;
  },
  async notifySubscriber(channel) {
    const qname = channel.replace(`${MQ_NAMESPACE}:rt:`, "");
    const messages = await QueueLogic.getAllMessages(qname);
    const queue = queues.find((q) => q.name === qname);
    messages
      .filter((message) => message.id)
      .map(QueueLogic.parseMessage)
      .map((message) => queue.subject.next(message));
  },
  initQueueSubject(qname) {
    if (!queues.map((queue) => queue.name).includes(qname)) {
      queues.push({
        name: qname,
        subject: new Subject(),
      });
      QueueLogic.registerDebugListener(qname);
    }
  },
  async createQueue(qname) {
    if (!Object.values(MESSAGE_QUEUES).includes(qname)) throw new Error(`Queue name ${qname} is not a valid queue name. Update the enums.`);
    QueueLogic.initQueueSubject(qname);
    const openQueues = await rsmq.listQueuesAsync();
    logger.debug(`Subscribing to redis queue "${qname}"`);
    subscriber.subscribe(`${MQ_NAMESPACE}:rt:${qname}`);
    if (!openQueues.includes(qname)) {
      await rsmq.createQueueAsync({ qname, vt: 60 * 10 }); // 10 Minutes message receive timeout
    }
  },
  parseMessage(rawMessage) {
    return {
      ...rawMessage,
      ...JSON.parse(rawMessage.message),
    };
  },
  subscribe(qname, callback) {
    const selectedQueue = queues.find((queue) => queue.name === qname);
    if (!selectedQueue) throw new Error(`Queue ${qname} not found. Subscription impossible.`);
    return selectedQueue.subject.subscribe({ next: callback });
  },
  subscribeToMessage(qname, requestedMessage, callback) {
    const selectedQueue = queues.find((queue) => queue.name === qname);
    if (!selectedQueue) throw new Error(`Queue ${qname} not found. Subscription impossible.`);
    return selectedQueue.subject.pipe(filter(({ message }) => message === requestedMessage)).subscribe({ next: callback });
  },
  registerDebugListener(qname) {
    logger.debug(`Subscribing locally to queue "${qname}"`);
    QueueLogic.subscribe(qname, (message) => logger.info(`NEW MESSAGE: { message: ${message.message}, id: ${message.id} }`));
  },
  async receiveMessage(qname) {
    return rsmq.receiveMessageAsync({ qname });
  },
  async sendMessage(qname, message, payload = {}) {
    if (!qname) {
      throw new Error(`Queue ${qname} is not valid`);
    }
    if (!message) {
      throw new Error(`Message ${message} is not valid`);
    }
    const [messageQueueName, messageQueueType, messageQueueAction] = message.split(".");
    if (!messageQueueName || !messageQueueType || !messageQueueAction) {
      throw new Error(`Message ${message} does not follow required pattern QUEUE.TYPE.ACTION`);
    }
    if (messageQueueName !== qname) {
      throw new Error(`Queue name in message ${message} does not match queue name ${qname}`);
    }
    if (!MESSAGES[qname][messageQueueType]) {
      throw new Error(`Message type ${messageQueueType} is unknown in queue ${qname}`);
    }
    if (!MESSAGES[qname][messageQueueType][messageQueueAction]) {
      throw new Error(`Message action ${messageQueueAction} is unknown in queue ${qname} with message type ${messageQueueType}`);
    }
    if (typeof payload !== "object") {
      throw new Error(`Payload has invalid type "${typeof payload}", expected "object"`);
    }
    return rsmq.sendMessageAsync({ qname, message: JSON.stringify({ message, payload }) });
  },
  async deleteMessage(qname, id) {
    return rsmq.deleteMessageAsync({ qname, id });
  },
  async clearRedisQueues() {
    const openQueues = await rsmq.listQueuesAsync();
    await Promise.all(openQueues.map((qname) => rsmq.deleteQueueAsync({ qname })));
  },
  async resetAll() {
    await QueueLogic.clearRedisQueues();
    await subscriber.unsubscribe();
    queues.map((queue) => queue.subject.complete());
    queues = [];
    await QueueLogic.init();
  },
};
export default QueueLogic;
