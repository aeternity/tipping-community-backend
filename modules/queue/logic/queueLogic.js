const { filter } = require('rxjs/operators');

const RedisSMQ = require('rsmq');
const { Subject } = require('rxjs');
const logger = require('../../../utils/logger')(module);
const { MESSAGE_QUEUES } = require('../constants/queue');

const rsmq = new RedisSMQ({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT || 6379, ns: 'rsmq' });

// TODO TEST
class MessageQueue {
  queues = [];

  constructor() {
    // Setup all queues
    this.interval = setInterval(() => this.notifySubscriber(), 100);
    // Create initial subjects
    Object.values(MESSAGE_QUEUES).map(qname => this.initQueueSubject(qname));
    logger.info('All MQs registered locally');
  }

  async init() {
    await Promise.all(Object.values(MESSAGE_QUEUES).map(qname => this.createQueue(qname).catch(e => logger.error(e))));
    logger.info('All MQs registered on redis');
  }

  notifySubscriber() {
    this.queues.map(async queue => {
      const message = await this.receiveMessage(queue.name).catch(e => logger.warn(`Reading queue ${queue.name} failed with ${e.message}`));
      if (message.id) queue.subject.next(message);
    });
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
    if (!this.queues.map(queue => queue.name).includes(qname)) {
      this.initQueueSubject(qname);
    }
    const openQueues = await rsmq.listQueuesAsync();
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
    logger.debug(`SUBSCRIBING TO: "${qname}"`);
    this.subscribe(qname, message => logger.debug(`NEW MESSAGE: { message: ${message.message}, id: ${message.id} }`));
  }

  async receiveMessage(qname) { return rsmq.receiveMessageAsync({ qname }); }

  async sendMessage(qname, message) { return rsmq.sendMessageAsync({ qname, message }); }

  async deleteMessage(qname, id) { return rsmq.deleteMessageAsync({ qname, id }); }

  async resetAll() {
    const openQueues = await rsmq.listQueuesAsync();
    await Promise.all(openQueues.map(qname => rsmq.deleteQueueAsync({ qname })));
    await this.init();
  }
}

const queueLogic = new MessageQueue();

module.exports = queueLogic;
