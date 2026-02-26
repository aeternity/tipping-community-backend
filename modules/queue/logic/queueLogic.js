const { filter } = require('rxjs/operators');

const RedisSMQ = require('rsmq');
const { Subject } = require('rxjs');
const redis = require('redis');
const logger = require('../../../utils/logger')(module);
const { MESSAGE_QUEUES, MESSAGES } = require('../constants/queue');

const MQ_NAMESPACE = 'rsmq';

let publisher;
let subscriber;
let rsmq = new RedisSMQ({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379,
  ns: MQ_NAMESPACE,
});
let queues = [];

function createRedisClient() {
  const url = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`;
  const client = redis.createClient(url);

  client.on('error', err => {
    logger.error(`Redis error: ${err.message}`);
  });

  client.on('end', () => {
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', () => {
    logger.warn('Redis reconnecting...');
  });

  return client;
}

async function waitForReady(client, name) {
  return new Promise((resolve, reject) => {
    const onReady = () => {
      logger.info(`Redis client "${name}" ready`);
      cleanup();
      resolve();
    };
    const onError = err => {
      logger.error(`Redis client "${name}" failed: ${err.message}`);
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      client.removeListener('ready', onReady);
      client.removeListener('error', onError);
    };

    client.once('ready', onReady);
    client.once('error', onError);
  });
}

const QueueLogic = {
  async init() {
    // Close any existing clients before creating new ones to prevent connection leaks
    if (publisher) {
      publisher.removeAllListeners();
      await new Promise(resolve => { publisher.quit(resolve); });
    }
    if (subscriber) {
      subscriber.removeAllListeners();
      await new Promise(resolve => { subscriber.quit(resolve); });
    }

    // 1) Create clients
    publisher = createRedisClient();
    subscriber = createRedisClient();

    // 2) Wait until both are ready
    await Promise.all([
      waitForReady(publisher, 'publisher'),
      waitForReady(subscriber, 'subscriber'),
    ]);

    // 3) Now create RSMQ on a ready client
    rsmq = new RedisSMQ({
      client: publisher,
      ns: MQ_NAMESPACE,
      realtime: true,
    });

    // 4) Create initial subjects
    Object.values(MESSAGE_QUEUES).map(qname => QueueLogic.initQueueSubject(qname));

    // 5) Wire subscriber
    subscriber.on('message', channel => QueueLogic.notifySubscriber(channel));
    logger.info('All MQs registered locally');

    // 6) Create queues in Redis
    await Promise.all(
      Object.values(MESSAGE_QUEUES).map(qname => QueueLogic.createQueue(qname).catch(e => logger.error(e))),
    );
    logger.info('All MQs registered on redis');
  },

  getQueues() {
    return queues;
  },

  async getAllMessages(qname) {
    let fetchSuccess = true;
    const allMessages = [];
    while (fetchSuccess) {
      // eslint-disable-next-line no-await-in-loop
      const message = await QueueLogic
        .receiveMessage(qname)
        .catch(e => logger.warn(`Reading queue ${qname} failed with ${e.message}`));
      fetchSuccess = message && message.id;
      if (fetchSuccess) {
        allMessages.push(message);
      }
    }
    return allMessages;
  },

  async notifySubscriber(channel) {
    const qname = channel.replace(`${MQ_NAMESPACE}:rt:`, '');
    const messages = await QueueLogic.getAllMessages(qname);
    const queue = queues.find(q => q.name === qname);
    messages
      .filter(message => message.id)
      .map(QueueLogic.parseMessage)
      .map(message => queue.subject.next(message));
  },

  initQueueSubject(qname) {
    if (!queues.map(queue => queue.name).includes(qname)) {
      queues.push({
        name: qname,
        subject: new Subject(),
      });
      QueueLogic.registerDebugListener(qname);
    }
  },

  async createQueue(qname) {
    if (!Object.values(MESSAGE_QUEUES).includes(qname)) {
      throw new Error(`Queue name ${qname} is not a valid queue name. Update the enums.`);
    }
    QueueLogic.initQueueSubject(qname);

    const openQueues = await rsmq.listQueuesAsync();
    logger.debug(`Subscribing to redis queue "${qname}"`);
    subscriber.subscribe(`${MQ_NAMESPACE}:rt:${qname}`);

    if (!openQueues.includes(qname)) {
      await rsmq.createQueueAsync({ qname, vt: 60 * 10 }); // 10 minutes
    }
  },

  parseMessage(rawMessage) {
    return {
      ...rawMessage,
      ...JSON.parse(rawMessage.message),
    };
  },

  subscribe(qname, callback) {
    const selectedQueue = queues.find(queue => queue.name === qname);
    if (!selectedQueue) throw new Error(`Queue ${qname} not found. Subscription impossible.`);
    return selectedQueue.subject.subscribe({ next: callback });
  },

  subscribeToMessage(qname, requestedMessage, callback) {
    const selectedQueue = queues.find(queue => queue.name === qname);
    if (!selectedQueue) throw new Error(`Queue ${qname} not found. Subscription impossible.`);
    return selectedQueue.subject
      .pipe(filter(({ message }) => message === requestedMessage))
      .subscribe({ next: callback });
  },

  registerDebugListener(qname) {
    logger.debug(`Subscribing locally to queue "${qname}"`);
    QueueLogic.subscribe(qname, message => logger.info(`NEW MESSAGE: { message: ${message.message}, id: ${message.id} }`));
  },

  async receiveMessage(qname) {
    return rsmq.receiveMessageAsync({ qname });
  },

  async sendMessage(qname, message, payload = {}) {
    if (!qname) throw new Error(`Queue ${qname} is not valid`);
    if (!message) throw new Error(`Message ${message} is not valid`);

    const [messageQueueName, messageQueueType, messageQueueAction] = message.split('.');
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
      throw new Error(
        `Message action ${messageQueueAction} is unknown in queue ${qname} with message type ${messageQueueType}`,
      );
    }
    if (typeof payload !== 'object') {
      throw new Error(`Payload has invalid type "${typeof payload}", expected "object"`);
    }

    return rsmq.sendMessageAsync({ qname, message: JSON.stringify({ message, payload }) });
  },

  async deleteMessage(qname, id) {
    return rsmq.deleteMessageAsync({ qname, id });
  },

  async clearRedisQueues() {
    if (!rsmq || !rsmq.client) return;
    const openQueues = await rsmq.listQueuesAsync();
    await Promise.all(openQueues.map(qname => rsmq.deleteQueueAsync({ qname })));
  },

  async resetAll() {
    await QueueLogic.clearRedisQueues();
    await subscriber.unsubscribe();
    queues.map(queue => queue.subject.complete());
    queues = [];
    await QueueLogic.init();
  },
};

module.exports = QueueLogic;
