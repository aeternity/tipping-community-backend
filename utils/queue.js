const RedisSMQ = require('rsmq');
const { Subject } = require('rxjs');
const logger = require('./logger')(module);
const { MESSAGE_QUEUES } = require('../models/enums/queues');

const rsmq = new RedisSMQ({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT || 6379, ns: 'rsmq' });

class MessageQueue {
  queues = [];

  init() {
    this.interval = setInterval(() => this.notifySubscriber(), 100);
  }

  notifySubscriber() {
    this.queues.map(async queue => {
      const message = await this.receiveMessage(queue.name).catch(e => logger.warn(`Reading queue ${queue.name} failed with ${e.message}`));
      if (message.id) queue.subject.next(message);
    });
  }

  async createQueue(qname) {
    if (!Object.values(MESSAGE_QUEUES).includes(qname)) throw new Error(`Queue name ${qname} is not a valid queue name. Update the enums.`);

    const openQueues = await rsmq.listQueuesAsync();
    if (!openQueues.includes(qname)) {
      await rsmq.createQueueAsync({ qname });
    }
    if (!this.queues.map(queue => queue.name).includes(qname)) {
      this.queues.push({
        name: qname,
        subject: new Subject(),
      });
    }
  }

  subscribe(qname, callback) {
    const selectedQueue = this.queues.find(queue => queue.name === qname);
    if (!selectedQueue) throw new Error(`Queue ${qname} not found. Subscription impossible.`);
    return selectedQueue.subject.subscribe({ next: callback });
  }

  async receiveMessage(qname) { return rsmq.receiveMessageAsync({ qname }); }

  async sendMessage(qname, message) { return rsmq.sendMessageAsync({ qname, message }); }

  async deleteMessage(qname, id) { return rsmq.deleteMessageAsync({ qname, id }); }
}

const queue = new MessageQueue();

module.exports = queue;
