const { MESSAGE_QUEUES } = require('../models/enums/queues');
const queue = require('../utils/queue');

const broker = {
  async init() {
    // Setup all queues
    await Promise.all(Object.values(MESSAGE_QUEUES).map(qname => queue.createQueue(qname).catch(e => console.error(e))));
  },

  async setupForwarding(sourceQueueName, targetQueues) {
    // SETUP LOGIC
    queue.subscribe(sourceQueueName, async message => {
      await Promise.all(targetQueues.map(targetQueueName => queue.sendMessage(targetQueueName, message.message)));
      await queue.deleteMessage(MESSAGE_QUEUES.PARENT, message.id);
    });
  },
};

module.exports = broker;
