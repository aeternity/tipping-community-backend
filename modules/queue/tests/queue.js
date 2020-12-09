const chai = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');
const { MESSAGE_QUEUES, MESSAGES } = require('../constants/queue');

const queue = require('../logic/queueLogic');

chai.should();

describe('Queue', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    await queue.resetAll();
    sandbox.restore();
  });

  describe('Queue Methods', () => {
    it('should init all queues', async () => {
      const initializedQueues = queue.queues.map(q => q.name);
      initializedQueues.should.deep.equal(Object.values(MESSAGE_QUEUES));
    });
    it('should reject a message that is ill typed', done => {
      queue.sendMessage('', 'SAMPLE_MESSAGE').catch(e => {
        e.message.should.eql('Message SAMPLE_MESSAGE does not follow required pattern QUEUE.TYPE.ACTION');
        done();
      });
    });
    it('should reject a message that does not match the queue', done => {
      queue.sendMessage('SAMPLE_QUEUE', 'QUEUE.TYPE.SAMPLE_MESSAGE').catch(e => {
        e.message.should.eql('Queue name in message QUEUE.TYPE.SAMPLE_MESSAGE does not match queue name SAMPLE_QUEUE');
        done();
      });
    });
    it('should reject a message that has an invalid type', done => {
      queue.sendMessage(MESSAGE_QUEUES.TEST, 'TEST.TYPE.SAMPLE_MESSAGE').catch(e => {
        e.message.should.eql('Message type TYPE is unknown in queue TEST');
        done();
      });
    });
    it('should reject a message that has an invalid action', done => {
      queue.sendMessage(MESSAGE_QUEUES.TEST, 'TEST.EVENTS.SAMPLE_MESSAGE').catch(e => {
        e.message.should.eql('Message action SAMPLE_MESSAGE is unknown in queue TEST with message type EVENTS');
        done();
      });
    });
    it('should send a message', async () => {
      await queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
    });
    it('should be able to subscribe to a queue', done => {
      queue.subscribe(MESSAGE_QUEUES.TEST, message => {
        message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);
        done();
      });
      queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
    });
    it('should be able to subscribe to a message', done => {
      queue.subscribeToMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND, message => {
        message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);
        done();
      });
      // SEND TEST_EVENT FIRST
      queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.EVENTS.TEST_EVENT).then(() => {
        queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      });
    });
    it('should be able to just pull a message', async () => {
      await queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      const message = await queue.receiveMessage(MESSAGE_QUEUES.TEST);
      message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);
    });
    it('should not be able to pull the same message twice in a short interval', async () => {
      await queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      const message = await queue.receiveMessage(MESSAGE_QUEUES.TEST);
      message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      const message2 = await queue.receiveMessage(MESSAGE_QUEUES.TEST);
      message2.should.deep.equal({});
    });
    it('should be able to delete a message', async () => {
      await queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      const message = await queue.receiveMessage(MESSAGE_QUEUES.TEST);
      message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      await queue.deleteMessage(MESSAGE_QUEUES.TEST, message.id);
    });
    it('should be able to clear all message queues', async () => {
      await queue.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      await queue.resetAll();
      const message = await queue.receiveMessage(MESSAGE_QUEUES.TEST);
      message.should.deep.equal({});
    });
  });
});
