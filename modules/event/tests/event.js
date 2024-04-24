import chai from 'chai';
import sinon from 'sinon';
import EventLogic from '../logic/eventLogic.js';
import queueLogic from '../../queue/logic/queueLogic.js';
import MdwLogic from '../../aeternity/logic/mdwLogic.js';
import aeternity from '../../aeternity/logic/aeternity.js';
import { MESSAGES, MESSAGE_QUEUES } from '../../queue/constants/queue.js';
import models from '../../../models/index.js';

const { Event } = models;
chai.should();
describe('Events', () => {
  // run init
  before(async () => {
    await Event.destroy({
      where: {},
      truncate: true,
    });
    await Event.create({
      name: 'TipTokenReceived',
      hash: '',
      contract: 'ct_',
      height: 100000,
      addresses: ['ak_1', 'ak_2'],
      time: 0,
      data: {},
    });
    EventLogic.init();
  });
  const sampleChainEvent = {
    event: {
      event: 'ReTipReceived',
      name: 'ReTipReceived',
      caller: 'ak_rRVV9aDnmmLriPePDSvfTUvepZtR2rbYk2Mx4GCqGLcc1DMAq',
      nonce: 74,
      height: 421337,
      hash: 'th_dAzGJC75VdSZkVNb2SuR3qnbozkqEHfpgMGfE2Cu9q6dAtHrs',
      contract: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z',
      address: 'ak_rRVV9aDnmmLriPePDSvfTUvepZtR2rbYk2Mx4GCqGLcc1DMAq',
      amount: '30000000000000000',
      url: 'https://twitter.com/PetrusValent/status/1387419653522198531',
      tokenContract: null,
      data: {
        tx: [Object],
        signatures: [Array],
        hash: 'th_dAzGJC75VdSZkVNb2SuR3qnbozkqEHfpgMGfE2Cu9q6dAtHrs',
        block_height: 421337,
        block_hash: 'mh_KXYDgit4ptzCdK9ycdRkRC4XyEcCLL7X5ueJwNyoJf35y8Kwq',
      },
    },
    tx: {
      callerId: 'ak_rRVV9aDnmmLriPePDSvfTUvepZtR2rbYk2Mx4GCqGLcc1DMAq',
      callerNonce: 74,
      contractId: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z',
      gasPrice: 1000000000,
      gasUsed: 3987,
      height: 421337,
      log: [[Object]],
      returnType: 'ok',
      returnValue: 'cb_P4fvHVw=',
    },
  };
  it('should return empty array if no events are found', async () => {
    const result = await EventLogic.getEventsForAddresses(['ak_fake']);
    result.should.be.an('array');
    result.should.have.length(0);
  });
  it('should return event if address is in addresses array', async () => {
    const result = await EventLogic.getEventsForAddresses(['ak_1']);
    result.should.be.an('array');
    result.should.have.length(1);
  });
  it('should return event if url is in data', async () => {
    await Event.create(EventLogic.prepareEventForDB(sampleChainEvent.event));
    const result = await EventLogic.getEventsForURL(sampleChainEvent.event.url);
    result.should.be.an('array');
    result.should.have.length(1);
  });
  it('should handle incoming events correctly', done => {
    queueLogic.sendMessage(MESSAGE_QUEUES.BLOCKCHAIN, MESSAGES.BLOCKCHAIN.EVENTS.EVENT_RECEIVED, sampleChainEvent);
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.RETIP_RECEIVED, async () => {
      const event = await Event.findOne({
        where: {
          hash: sampleChainEvent.event.hash,
        },
        raw: true,
      });
      event.should.have.property('name', sampleChainEvent.event.name);
      event.should.have.property('hash', sampleChainEvent.event.hash);
      event.should.have.property('contract', sampleChainEvent.event.contract);
      event.should.have.property('height', sampleChainEvent.event.height);
      event.should.have.property('addresses');
      event.addresses.should.eql([sampleChainEvent.event.address]);
      done();
    });
  });
  it('should handle keephot', done => {
    const currentHeight = 21;
    sinon.stub(aeternity, 'getHeight').callsFake(async () => currentHeight);
    const mdwSpy = sinon.stub(MdwLogic, 'middlewareContractTransactions').callsFake(async () => [sampleChainEvent.event]);
    Event.bulkCreate([{
      name: 'TipTokenReceived',
      hash: '1',
      contract: 'ct_',
      height: currentHeight,
      addresses: ['ak_1', 'ak_2'],
      time: 0,
      data: {},
    }, {
      name: 'TipTokenReceived',
      hash: '2',
      contract: 'ct_',
      height: currentHeight - 21,
      addresses: ['ak_1', 'ak_2'],
      time: 0,
      data: {},
    }]).then(() => queueLogic.sendMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_EVENTS));
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_EVENTS, () => {
      setTimeout(async () => {
        mdwSpy.calledOnce.should.equal(true);
        sinon.assert.calledWith(mdwSpy, currentHeight, currentHeight - 20);
        // event 1 gone
        const event1 = await Event.findAll({
          where: {
            hash: '1',
          },
          raw: true,
        });
        event1.should.have.length(0);
        // event 2 still there
        const event2 = await Event.findAll({
          where: {
            hash: '2',
          },
          raw: true,
        });
        event2.should.have.length(1);
        // sample event also there
        const event3 = await Event.findAll({
          where: {
            hash: sampleChainEvent.event.hash,
          },
          raw: true,
        });
        event3.should.have.length(1);
        done();
      }, 100);
    });
  });
  afterEach(() => {
    sinon.restore();
  });
});
