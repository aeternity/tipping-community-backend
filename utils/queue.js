const RedisSMQ = require('rsmq');
const rsmq = new RedisSMQ({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT || 6379, ns: 'rsmq' });

class MessageQueue {
  createQueue = async qname => rsmq.createQueueAsync({ qname });

  receiveMessage = async qname => rsmq.receiveMessageAsync({ qname });

  sendMessage = async (qname, message) => rsmq.sendMessageAsync({ qname, message });
}

const queue = new MessageQueue();

module.exports = queue;
