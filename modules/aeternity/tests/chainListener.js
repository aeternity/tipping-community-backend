// Require the dev-dependencies
/* eslint no-underscore-dangle: 0 */
const chai = require('chai');
const chaiHttp = require('chai-http');
const {
  describe, it,
} = require('mocha');
const sinon = require('sinon');
const rewire = require('rewire');
const aeternity = require('../logic/aeternity');
const queueLogic = require('../../queue/logic/queueLogic');
const { MESSAGES } = require('../../queue/constants/queue');
const { MESSAGE_QUEUES } = require('../../queue/constants/queue');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Chain Listener', () => {
  describe('Events', () => {
    before(async function () {
      this.timeout(10000);
      await aeternity.init();
    });

    it('it should connect to the websocket', done => {
      const ChainListenerLogic = rewire('../logic/chainListenerLogic');

      const handleConnectionInitObject = {
        handleConnectionInit: ChainListenerLogic.__get__('handleConnectionInit'),
      };

      const stubHandleConnectionInitObject = sinon
        .stub(handleConnectionInitObject, 'handleConnectionInit')
        .callsFake(() => {
          stubHandleConnectionInitObject.restore();
          done();
        });

      ChainListenerLogic.__with__(handleConnectionInitObject)(async () => {
        await ChainListenerLogic.startInvalidator();
      });
    });

    it('it should init the contracts', done => {
      const ChainListenerLogic = rewire('../logic/chainListenerLogic');

      const stubObj = {
        subscribeToContract: ChainListenerLogic.__get__('subscribeToContract'),
      };

      const contractsInOrder = [
        process.env.CONTRACT_V1_ADDRESS,
        process.env.CONTRACT_V2_ADDRESS,
        process.env.CONTRACT_V3_ADDRESS,
        process.env.WORD_REGISTRY_CONTRACT,
      ];
      const stub = sinon
        .stub(stubObj, 'subscribeToContract')
        .callsFake(() => {
          const expectedContract = contractsInOrder.shift();
          sinon.assert.calledWith(stub, expectedContract);
          if (contractsInOrder.length === 0) {
            stub.restore();
            done();
          }
        });

      ChainListenerLogic.__set__(stubObj);
      ChainListenerLogic.startInvalidator();
    });

    it('it should handle the messages', done => {
      const ChainListenerLogic = rewire('../logic/chainListenerLogic');

      const stubObj = {
        handleContractEvent: ChainListenerLogic.__get__('handleContractEvent'),
      };
      const handleWebsocketMessage = ChainListenerLogic.__get__('handleWebsocketMessage');

      const stub = sinon
        .stub(stubObj, 'handleContractEvent')
        .callsFake(event => {
          event.should.be.an('object');
          event.should.have.property('name', 'TipReceived');
          event.should.have.property('address', 'ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag');
          event.should.have.property('amount', 120000000000000000n);
          event.should.have.property('url', 'https://github.com/thepiwo');
          event.should.have.property('tokenContract', null);

          stub.restore();
          done();
        });

      ChainListenerLogic.__set__(stubObj);

      handleWebsocketMessage({
        type: 'utf8',
        utf8Data: '{"subscription":"Object","payload":{"hash":"th_2v3CPSJQaAXzdsYbU6mh4ZrcZuMsPBasteezdCv2mGaHXXrt9s"}}',
      });
    });

    it('it should handle contract events', done => {
      const ChainListenerLogic = rewire('../logic/chainListenerLogic');
      const handleContractEvent = ChainListenerLogic.__get__('handleContractEvent');

      const stub = sinon.stub(queueLogic, 'sendMessage').callsFake((queue, message) => {
        queue.should.equal(MESSAGE_QUEUES.BLOCKCHAIN);
        message.should.equal(MESSAGES.BLOCKCHAIN.EVENTS.EVENT_RECEIVED);
        stub.restore();
        done();
      });

      handleContractEvent({
        name: 'TipReceived',
      });
    });
  });
});
