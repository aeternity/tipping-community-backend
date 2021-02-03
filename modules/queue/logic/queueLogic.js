const { filter } = require('rxjs/operators');

const RedisSMQ = require('rsmq');
const { Subject } = require('rxjs');
const redis = require('redis');
const logger = require('../../../utils/logger')(module);
const { MESSAGE_QUEUES, MESSAGES } = require('../constants/queue');

const publisher = redis.createClient(`redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`);
const subscriber = redis.createClient(`redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`);
const MQ_NAMESPACE = 'rsmq';
const rsmq = new RedisSMQ({
  publisher,
  ns: MQ_NAMESPACE,
  realtime: true,
});

class MessageQueue {
  queues = [];

  constructor() {
    // Create initial subjects
    Object.values(MESSAGE_QUEUES).map(qname => this.initQueueSubject(qname));
    subscriber.on('message', channel => this.notifySubscriber(channel));
    logger.info('All MQs registered locally');
  }

  async init() {
    await Promise.all(Object.values(MESSAGE_QUEUES).map(qname => this.createQueue(qname).catch(e => logger.error(e))));
    logger.info('All MQs registered on redis');
  }

  async notifySubscriber(channel) {
    const qname = channel.replace(`${MQ_NAMESPACE}:rt:`, '');
    const message = await this.receiveMessage(qname).catch(e => logger.warn(`Reading queue ${qname} failed with ${e.message}`));
    const queue = this.queues.find(q => q.name === qname);
    if (message.id) queue.subject.next(message);
  }

  initQueueSubject(qname) {
    if (!this.queues.map(queue => queue.name).includes(qname)) {
      this.queues.push({
        name: qname,
        subject: new Subject(),
      });
      this.registerDebugListener(qname);
    }
  }

  async createQueue(qname) {
    if (!Object.values(MESSAGE_QUEUES).includes(qname)) throw new Error(`Queue name ${qname} is not a valid queue name. Update the enums.`);
    this.initQueueSubject(qname);
    const openQueues = await rsmq.listQueuesAsync();
    logger.debug(`Subscribing to redis queue "${qname}"`);
    subscriber.subscribe(`${MQ_NAMESPACE}:rt:${qname}`);
    if (!openQueues.includes(qname)) {
      await rsmq.createQueueAsync({ qname, vt: 60 * 10 }); // 10 Minutes message receive timeout
    }
  }

  subscribe(qname, callback) {
    const selectedQueue = this.queues.find(queue => queue.name === qname);
    if (!selectedQueue) throw new Error(`Queue ${qname} not found. Subscription impossible.`);
    return selectedQueue.subject.subscribe({ next: callback });
  }

  subscribeToMessage(qname, requestedMessage, callback) {
    const selectedQueue = this.queues.find(queue => queue.name === qname);
    if (!selectedQueue) throw new Error(`Queue ${qname} not found. Subscription impossible.`);
    return selectedQueue.subject.pipe(filter(({ message }) => message === requestedMessage)).subscribe({ next: callback });
  }

  registerDebugListener(qname) {
    logger.debug(`Subscribing locally to queue "${qname}"`);
    this.subscribe(qname, message => logger.debug(`NEW MESSAGE: { message: ${message.message}, id: ${message.id} }`));
  }

  async receiveMessage(qname) { return rsmq.receiveMessageAsync({ qname }); }

  async sendMessage(qname, message) {
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
      throw new Error(`Message action ${messageQueueAction} is unknown in queue ${qname} with message type ${messageQueueType}`);
    }
    return rsmq.sendMessageAsync({ qname, message });
  }

  async deleteMessage(qname, id) { return rsmq.deleteMessageAsync({ qname, id }); }

  async clearRedisQueues() {
    const openQueues = await rsmq.listQueuesAsync();
    await Promise.all(openQueues.map(qname => rsmq.deleteQueueAsync({ qname })));
  }

  async resetAll() {
    await this.clearRedisQueues();
    await subscriber.unsubscribe();
    this.queues.map(queue => queue.subject.complete());
    this.queues = [];
    await this.init();
  }
}

const queueLogic = new MessageQueue();

module.exports = queueLogic;
