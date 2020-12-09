const chai = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');
const { MESSAGE_QUEUES, MESSAGES } = require('../constants/queue');

const queue = require('../logic/queueLogic');
const messageBroker = require('../logic/messageBrokerLogic');

chai.should();

describe('Message Broker', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    await queue.resetAll();
    sandbox.restore();
  });

  describe('Forwarding', () => {
    it('should be able to forward one message to one queue', done => {
      messageBroker.setupForwarding({
        queueName: MESSAGE_QUEUES.TEST,
        message: MESSAGES.TEST.EVENTS.TEST_EVENT,
      }, [
        { queueName: MESSAGE_QUEUES.TEST, message: MESSAGES.TEST.COMMANDS.TEST_COMMAND },
      ]);
      queue.subscribeToMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND, message => {
        message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);
        done();
      });
      queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.EVENTS.TEST_EVENT);
    });

    it('should remove all forwardings when queues are reset', done => {
      queue.resetAll().then(() => {
        queue.subscribe(MESSAGE_QUEUES.TEST, async message => {
          message.message.should.equal(MESSAGES.TEST.EVENTS.TEST_EVENT);

          const command = await queue.receiveMessage(MESSAGE_QUEUES.TEST);
          command.should.deep.equal({});
          done();
        });
        queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.EVENTS.TEST_EVENT);
      });
    });

    it('should not forward another message in the same queue', done => {
      messageBroker.setupForwarding({
        queueName: MESSAGE_QUEUES.TEST,
        message: MESSAGES.TEST.EVENTS.TEST_EVENT,
      }, [
        { queueName: MESSAGE_QUEUES.TEST, message: MESSAGES.TEST.COMMANDS.TEST_COMMAND_2 },
      ]);

      queue.subscribe(MESSAGE_QUEUES.TEST, async message => {
        message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);

        const command = await queue.receiveMessage(MESSAGE_QUEUES.TEST);

        command.should.deep.equal({});
        done();
      });
      queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
    });

    it('should be able to forward one message to multiple queues', done => {
      messageBroker.setupForwarding({
        queueName: MESSAGE_QUEUES.TEST,
        message: MESSAGES.TEST.EVENTS.TEST_EVENT,
      }, [
        { queueName: MESSAGE_QUEUES.TEST, message: MESSAGES.TEST.COMMANDS.TEST_COMMAND },
        { queueName: MESSAGE_QUEUES.TEST_2, message: MESSAGES.TEST_2.COMMANDS.TEST_COMMAND },
      ]);

      Promise.all([
        new Promise(resolve => queue.subscribe(MESSAGE_QUEUES.TEST, async message => {
          message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);

          const command = await queue.receiveMessage(MESSAGE_QUEUES.TEST);
          command.should.deep.equal({});
          resolve();
        })),
        new Promise(resolve => queue.subscribe(MESSAGE_QUEUES.TEST_2, async message => {
          message.message.should.equal(MESSAGES.TEST_2.COMMANDS.TEST_COMMAND);

          const command = await queue.receiveMessage(MESSAGE_QUEUES.TEST_2);
          command.should.deep.equal({});
          resolve();
        })),
      ]).then(() => done());
      queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.EVENTS.TEST_EVENT);
    });
  });
});
