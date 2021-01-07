const { MESSAGE_QUEUES, MESSAGES } = require('../constants/queue');
const queueLogic = require('./queueLogic');

class MessageBroker {
  async init() {
    // S: UPDATE TIPS CACHE
    // T: UPDATE TIPS DB
    // T: UPDATE RETIPS DB
    this.setupForwarding({
      queueName: MESSAGE_QUEUES.CACHE,
      message: MESSAGES.CACHE.EVENTS.RENEWED_TIPS,
    }, [
      { queueName: MESSAGE_QUEUES.TIPS, message: MESSAGES.TIPS.COMMANDS.UPDATE_DB },
      { queueName: MESSAGE_QUEUES.RETIPS, message: MESSAGES.RETIPS.COMMANDS.UPDATE_DB },
    ]);

    // S: UPDATE TIPS DB
    // T: UPDATE LINKPREVIEWS
    this.setupForwarding({
      queueName: MESSAGE_QUEUES.TIPS,
      message: MESSAGES.TIPS.EVENTS.CREATED_NEW_LOCAL_TIPS,
    }, [
      { queueName: MESSAGE_QUEUES.LINKPREVIEW, message: MESSAGES.LINKPREVIEW.COMMANDS.UPDATE_DB },
    ]);

    // S: UPDATED CHAIN NAMES
    // T: UPDATE PREFERRED CHAIN NAMES
    this.setupForwarding({
      queueName: MESSAGE_QUEUES.CACHE,
      message: MESSAGES.CACHE.EVENTS.RENEWED_CHAINNAMES,
    }, [
      { queueName: MESSAGE_QUEUES.PROFILE, message: MESSAGES.PROFILE.COMMANDS.UPDATE_PREFERRED_CHAIN_NAMES },
    ]);
  }

  setupForwarding(source, targets) {
    // SETUP LOGIC
    queueLogic.subscribeToMessage(source.queueName, source.message, async message => {
      await Promise.all(targets.map(({ queueName, message: newMessage }) => queueLogic.sendMessage(queueName, newMessage)));
      await queueLogic.deleteMessage(source.queueName, message.id);
    });
  }
}

const broker = new MessageBroker();

module.exports = broker;
