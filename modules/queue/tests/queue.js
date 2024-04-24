import chai from "chai";
import mocha from "mocha";
import sinon from "sinon";
import { MESSAGE_QUEUES, MESSAGES } from "../constants/queue.js";
import queueLogic from "../logic/queueLogic.js";

const { describe, it } = mocha;
chai.should();
describe("Queue", () => {
  afterEach(async () => {
    await queueLogic.resetAll();
    sinon.restore();
  });
  describe("Queue Methods", () => {
    it("should init all queues", async () => {
      const initializedQueues = queueLogic.getQueues().map((q) => q.name);
      initializedQueues.should.deep.equal(Object.values(MESSAGE_QUEUES));
    });
    it("should reject a message with no queue", (done) => {
      queueLogic.sendMessage("", "SAMPLE_MESSAGE").catch((e) => {
        e.message.should.eql("Queue  is not valid");
        done();
      });
    });
    it("should reject an empty message", (done) => {
      queueLogic.sendMessage("SAMPLE_QUEUE", "").catch((e) => {
        e.message.should.eql("Message  is not valid");
        done();
      });
    });
    it("should reject a message that is ill typed", (done) => {
      queueLogic.sendMessage("SAMPLE_QUEUE", "SAMPLE_MESSAGE").catch((e) => {
        e.message.should.eql("Message SAMPLE_MESSAGE does not follow required pattern QUEUE.TYPE.ACTION");
        done();
      });
    });
    it("should reject a message that does not match the queue", (done) => {
      queueLogic.sendMessage("SAMPLE_QUEUE", "QUEUE.TYPE.SAMPLE_MESSAGE").catch((e) => {
        e.message.should.eql("Queue name in message QUEUE.TYPE.SAMPLE_MESSAGE does not match queue name SAMPLE_QUEUE");
        done();
      });
    });
    it("should reject a message that has an invalid type", (done) => {
      queueLogic.sendMessage(MESSAGE_QUEUES.TEST, "TEST.TYPE.SAMPLE_MESSAGE").catch((e) => {
        e.message.should.eql("Message type TYPE is unknown in queue TEST");
        done();
      });
    });
    it("should reject a message that has an invalid action", (done) => {
      queueLogic.sendMessage(MESSAGE_QUEUES.TEST, "TEST.EVENTS.SAMPLE_MESSAGE").catch((e) => {
        e.message.should.eql("Message action SAMPLE_MESSAGE is unknown in queue TEST with message type EVENTS");
        done();
      });
    });
    it("should reject a message that has an invalid payload", (done) => {
      queueLogic.sendMessage(MESSAGE_QUEUES.TEST, "TEST.EVENTS.TEST_EVENT", "").catch((e) => {
        e.message.should.eql('Payload has invalid type "string", expected "object"');
        done();
      });
    });
    it("should send a message", async () => {
      await queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
    });
    it("should send a message with payload", async () => {
      await queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND, { test: "test" });
    });
    it("should be able to subscribe to a queue and receive a message", (done) => {
      queueLogic.subscribe(MESSAGE_QUEUES.TEST, (message) => {
        message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);
        done();
      });
      queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
    });
    it("should be able to subscribe to a queue and receive a message with payload", (done) => {
      queueLogic.subscribe(MESSAGE_QUEUES.TEST, (message) => {
        message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);
        message.payload.should.have.property("test", "test");
        done();
      });
      queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND, { test: "test" });
    });
    it("should be able to subscribe to a message", (done) => {
      queueLogic.subscribeToMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND, (message) => {
        message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);
        done();
      });
      // SEND TEST_EVENT FIRST
      queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.EVENTS.TEST_EVENT).then(() => {
        queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      });
    });
    it("should be able to subscribe to a message with payload", (done) => {
      queueLogic.subscribeToMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND, (message) => {
        message.message.should.equal(MESSAGES.TEST.COMMANDS.TEST_COMMAND);
        message.payload.should.have.property("test", "test");
        done();
      });
      // SEND TEST_EVENT FIRST
      queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.EVENTS.TEST_EVENT).then(() => {
        queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND, { test: "test" });
      });
    });
    it("should be able to just pull a message", async () => {
      await queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      const message = await queueLogic.receiveMessage(MESSAGE_QUEUES.TEST);
      message.message.should.equal(JSON.stringify({ message: MESSAGES.TEST.COMMANDS.TEST_COMMAND, payload: {} }));
    });
    it("should not be able to pull the same message twice in a short interval", async () => {
      await queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      const message = await queueLogic.receiveMessage(MESSAGE_QUEUES.TEST);
      message.message.should.equal(JSON.stringify({ message: MESSAGES.TEST.COMMANDS.TEST_COMMAND, payload: {} }));
      const message2 = await queueLogic.receiveMessage(MESSAGE_QUEUES.TEST);
      message2.should.deep.equal({});
    });
    it("should be able to delete a message", async () => {
      await queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      const message = await queueLogic.receiveMessage(MESSAGE_QUEUES.TEST);
      message.message.should.equal(JSON.stringify({ message: MESSAGES.TEST.COMMANDS.TEST_COMMAND, payload: {} }));
      await queueLogic.deleteMessage(MESSAGE_QUEUES.TEST, message.id);
    });
    it("should be able to clear all message queues", async () => {
      await queueLogic.sendMessage(MESSAGE_QUEUES.TEST, MESSAGES.TEST.COMMANDS.TEST_COMMAND);
      await queueLogic.resetAll();
      const message = await queueLogic.receiveMessage(MESSAGE_QUEUES.TEST);
      message.should.deep.equal({});
    });
  });
});
