const chai = require('chai');
const sinon = require('sinon');
const EventLogic = require('../logic/eventLogic');
const queueLogic = require('../../queue/logic/queueLogic');
const MdwLogic = require('../../aeternity/logic/mdwLogic');
const aeternity = require('../../aeternity/logic/aeternity');
const { MESSAGES, MESSAGE_QUEUES } = require('../../queue/constants/queue');
const { Event } = require('../../../models');

chai.should();

describe('Events', () => {
  // run init
  before(async () => { // Before all test we empty the database
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

  const sampleEvent = {
    event: 'ReTipReceived',
    name: 'ReTipReceived',
    caller: 'ak_rRVV9aDnmmLriPePDSvfTUvepZtR2rbYk2Mx4GCqGLcc1DMAq',
    nonce: 69,
    height: 411007,
    hash: 'th_AkZrxnHFZrNEhT84ipY3D9t31hDFoC2zDWXj9wE8GTLp3h95J',
    contract: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z',
    address: 'ak_rRVV9aDnmmLriPePDSvfTUvepZtR2rbYk2Mx4GCqGLcc1DMAq',
    amount: '50000000000000000',
    url: 'https://superhero.com/user-profile/ak_QWxf7hEM8CFPi3SmWSNTByQDKE2E5fgntPbEDwi7xvfb7SWwY',
    tokenContract: null,
    data: {
      tx: {
        version: 1,
        type: 'ContractCallTx',
        nonce: 70,
        gas_price: 1000000000,
        gas: 1579000,
        fee: 182220000000000,
        contract_id: 'ct_2AfnEfCSZCTEkxL5Yoi4Yfq6fF7YapHRaFKDJK3THMXMBspp5z',
        caller_id: 'ak_rRVV9aDnmmLriPePDSvfTUvepZtR2rbYk2Mx4GCqGLcc1DMAq',
        call_data: 'cb_KxEq+mD+G2+CCpxN/43z',
        amount: 50000000000000000,
        abi_version: 3,
      },
      signatures: [
        'sg_LLgUvEG5QJuth4LuD8NP1hBqiD4FuGHawMWuLt4LpBB8XyvoN11VGZkuCezKFf6TQVZcPKWBZWhV5pcNTyiCiTST3EhHD',
      ],
      hash: 'th_tDiecd3JMWidzpeU6ggKHQB7DSenFB6fg2H29C8AyXJhZLije',
      block_height: 411008,
      block_hash: 'mh_e75WwUDtHL5ejCpKgUgSPDe68VJpdZXhxFZU42tSc8UKGddrG',
      log: [[]],
    },
  };

  it('should return empty array if no events are found', async () => {
    const result = await EventLogic.getRelevantEventsFromDB(['ak_fake']);
    result.should.be.an('array');
    result.should.have.length(0);
  });
  it('should return event if address is in addresses array', async () => {
    const result = await EventLogic.getRelevantEventsFromDB(['ak_1']);
    result.should.be.an('array');
    result.should.have.length(1);
  });

  it('should handle incoming events correctly', done => {
    queueLogic.sendMessage(MESSAGE_QUEUES.BLOCKCHAIN, MESSAGES.BLOCKCHAIN.EVENTS.EVENT_RECEIVED, sampleEvent);
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.EVENTS.TIP_RECEIVED, async () => {
      const event = await Event.findOne({
        where: {
          hash: sampleEvent.hash,
        },
        raw: true,
      });
      event.should.have.property('name', sampleEvent.name);
      event.should.have.property('hash', sampleEvent.hash);
      event.should.have.property('contract', sampleEvent.contract);
      event.should.have.property('height', sampleEvent.height);
      event.should.have.property('addresses');
      event.addresses.should.eql([sampleEvent.address]);
      done();
    });
  });

  it('should handle keephot', done => {
    const currentHeight = 20;
    sinon.stub(aeternity, 'getHeight').callsFake(async () => currentHeight);
    const mdwSpy = sinon.stub(MdwLogic, 'middlewareContractTransactions').callsFake(async () => [sampleEvent]);

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
    }]).then(() => queueLogic.sendMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.COMMANDS.KEEPHOT));

    queueLogic.subscribeToMessage(MESSAGE_QUEUES.EVENTS, MESSAGES.EVENTS.COMMANDS.KEEPHOT, () => {
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
            hash: sampleEvent.hash,
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
