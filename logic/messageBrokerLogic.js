const { MESSAGE_QUEUES } = require('../models/enums/queues');
const queue = require('../utils/queue');

const broker = {
  async init() {
    // Setup all queues
    await Promise.all(Object.values(MESSAGE_QUEUES).map(qname => queue.createQueue(qname).catch(e => console.error(e))));

    // SETUP LOGIC
    queue.subscribe(MESSAGE_QUEUES.PARENT, message => {
      queue.sendMessage(MESSAGE_QUEUES.CHILD, message.message);
      queue.deleteMessage(MESSAGE_QUEUES.PARENT, message.id);
    });
  },
};

module.exports = broker;
