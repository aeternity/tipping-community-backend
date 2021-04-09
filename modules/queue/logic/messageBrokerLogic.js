const { MESSAGE_QUEUES, MESSAGES } = require('../constants/queue');
const queueLogic = require('./queueLogic');

class MessageBroker {
  init() {
    // S: UPDATE TIPS CACHE
    // T: UPDATE TIPS DB
    this.setupForwarding({
      queueName: MESSAGE_QUEUES.CACHE,
      message: MESSAGES.CACHE.EVENTS.RENEWED_TIPS,
    }, [
      { queueName: MESSAGE_QUEUES.TIPS, message: MESSAGES.TIPS.COMMANDS.UPDATE_DB },
    ]);

    // S: UPDATED TIPS DB
    // T: UPDATE RETIPS DB
    this.setupForwarding({
      queueName: MESSAGE_QUEUES.TIPS,
      message: MESSAGES.TIPS.EVENTS.UPDATE_DB_FINISHED,
    }, [
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

    // S: NEW TIP
    // T: UPDATE TIPS
    this.setupForwarding({
      queueName: MESSAGE_QUEUES.EVENTS,
      message: MESSAGES.EVENTS.EVENTS.TIP_RECEIVED,
    }, [
      { queueName: MESSAGE_QUEUES.TIPS, message: MESSAGES.TIPS.COMMANDS.INSERT_TIP },
    ]);

    // S: NEW TIP
    // T: UPDATE TIPS
    this.setupForwarding({
      queueName: MESSAGE_QUEUES.BLOCKCHAIN,
      message: MESSAGES.BLOCKCHAIN.EVENTS.RETIP_RECEIVED,
    }, [
      { queueName: MESSAGE_QUEUES.RETIPS, message: MESSAGES.RETIPS.COMMANDS.INSERT_RETIP },
    ]);

    // S: TIP CLAIMED
    // T: UPDATE PREFERRED CHAIN NAMES
    this.setupForwarding({
      queueName: MESSAGE_QUEUES.EVENTS,
      message: MESSAGES.EVENTS.EVENTS.TIP_WITHDRAWN,
    }, [
      { queueName: MESSAGE_QUEUES.CACHE, message: MESSAGES.CACHE.COMMANDS.RENEW_TIPS },
    ]);

    // S: INVALIDATION REQUEST
    // T: UPDATE PREFERRED CHAIN NAMES
    this.setupForwarding({
      queueName: MESSAGE_QUEUES.CACHE,
      message: MESSAGES.CACHE.EVENTS.TIP_INVALIDATION_REQUEST,
    }, [
      { queueName: MESSAGE_QUEUES.CACHE, message: MESSAGES.CACHE.COMMANDS.RENEW_TIPS },
    ]);

    // S: CACHE KEEPHOT
    // T: UPDATE EVENTS DB
    this.setupForwarding({
      queueName: MESSAGE_QUEUES.CACHE,
      message: MESSAGES.CACHE.COMMANDS.KEEPHOT,
    }, [
      { queueName: MESSAGE_QUEUES.EVENTS, message: MESSAGES.EVENTS.COMMANDS.KEEPHOT },
    ]);
  }

  setupForwarding(source, targets) {
    // SETUP LOGIC
    queueLogic.subscribeToMessage(source.queueName, source.message, async message => {
      await Promise.all(targets.map(({ queueName, message: newMessage }) => queueLogic.sendMessage(queueName, newMessage, message.payload)));
      await queueLogic.deleteMessage(source.queueName, message.id);
    });
  }
}

const broker = new MessageBroker();

module.exports = broker;
