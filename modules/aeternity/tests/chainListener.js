import rewire from "rewire";
import aeternity from "../logic/aeternity.js";
import queueLogic from "../../queue/logic/queueLogic.js";
import { MESSAGES, MESSAGE_QUEUES } from "../../queue/constants/queue.js";
import { afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals";
import ChainListenerLogic from "../logic/chainListenerLogic.js";

// Our parent block
describe("Chain Listener", () => {
  describe("Events", () => {
    beforeAll(async () => {
      this.timeout(10000);
      await aeternity.init();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("it should connect to the websocket", async () => {
      const stubHandleConnectionInitObject = jest.spyOn(ChainListenerLogic, "handleConnectionInit").mockResolvedValue(undefined);
      await ChainListenerLogic.startInvalidator();
      expect(stubHandleConnectionInitObject).toHaveBeenCalled();
    });
    it("it should init the contracts", (done) => {
      const ChainListenerLogic = rewire("../logic/chainListenerLogic");
      const stubObj = {
        subscribeToContract: ChainListenerLogic.__get__("subscribeToContract"),
      };
      const contractsInOrder = [process.env.CONTRACT_V1_ADDRESS, process.env.CONTRACT_V2_ADDRESS, process.env.CONTRACT_V3_ADDRESS, process.env.WORD_REGISTRY_CONTRACT];
      const stub = jest.spyOn(stubObj, "subscribeToContract").mockImplementation(() => {
        const expectedContract = contractsInOrder.shift();
        expect(stub).toHaveBeenCalledWith(expectedContract);
        if (contractsInOrder.length === 0) {
          done();
        }
      });
      ChainListenerLogic.__set__(stubObj);
      ChainListenerLogic.startInvalidator();
    });
    it("it should handle the messages", (done) => {
      const ChainListenerLogic = rewire("../logic/chainListenerLogic");
      const stubObj = {
        handleContractEvent: ChainListenerLogic.__get__("handleContractEvent"),
      };
      const handleWebsocketMessage = ChainListenerLogic.__get__("handleWebsocketMessage");
      const stub = jest
        .spyOn(stubObj, "handleContractEvent")
        .mockClear()
        .mockImplementation((event) => {
          event.should.be.an("object");
          event.should.have.property("name", "TipReceived");
          event.should.have.property("address", "ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag");
          event.should.have.property("amount", "120000000000000000");
          event.should.have.property("url", "https://github.com/thepiwo");
          event.should.have.property("tokenContract", null);
          stub.mockRestore();
          done();
        });
      ChainListenerLogic.__set__(stubObj);
      handleWebsocketMessage({
        type: "utf8",
        utf8Data: '{"subscription":"Object","payload":{"hash":"th_2v3CPSJQaAXzdsYbU6mh4ZrcZuMsPBasteezdCv2mGaHXXrt9s"}}',
      });
    }, 10000);
    it("it should handle contract events", (done) => {
      const ChainListenerLogic = rewire("../logic/chainListenerLogic");
      const handleContractEvent = ChainListenerLogic.__get__("handleContractEvent");
      const stub = jest
        .spyOn(queueLogic, "sendMessage")
        .mockClear()
        .mockImplementation((queue, message) => {
          queue.should.equal(MESSAGE_QUEUES.BLOCKCHAIN);
          message.should.equal(MESSAGES.BLOCKCHAIN.EVENTS.EVENT_RECEIVED);
          stub.mockRestore();
          done();
        });
      handleContractEvent({
        name: "TipReceived",
      });
    });
  });
});
