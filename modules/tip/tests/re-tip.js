const chai = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const CacheLogic = require('../../cache/logic/cacheLogic');
const TipLogic = require('../logic/tipLogic');
const queue = require('../../queue/logic/queueLogic');
const { TIP_TYPES } = require('../constants/tipTypes');
const { Tip, Retip, Notification } = require('../../../models');

chai.should();

describe('(Re)Tips', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(queue, 'sendMessage');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('DB', () => {
    beforeEach(async () => {
      await Retip.destroy({
        where: {},
        truncate: true,
      });

      await Tip.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });

      await Notification.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });
    });

    it('it should CREATE an unclaimed tip without retips in db', async () => {
      const fakeData = [
        {
          sender: 'ak_tip',
          title: 'test tip in english',
          id: '10',
          url: 'https://superhero.com/',
          retips: [],
          claim: {
            unclaimed: true,
          },
        },
      ];

      sandbox.stub(CacheLogic, 'getTips').callsFake(async () => fakeData);

      await TipLogic.updateTipsDB();
      await TipLogic.updateRetipsDB();

      const tip = await Tip.findOne({
        where: {
          id: fakeData[0].id,
        },
      });

      tip.should.have.property('id', fakeData[0].id);
      tip.should.have.property('language', 'en');
      tip.should.have.property('type', TIP_TYPES.AE_TIP);
      tip.should.have.property('unclaimed', true);
      tip.should.have.property('sender', 'ak_tip');
    });

    it('it should CREATE an tip with and without media in the db', async () => {
      const fakeData = [
        {
          sender: 'ak_tip',
          title: 'test tip in english',
          id: '10',
          url: 'https://superhero.com/',
          retips: [],
          media: ['http://test'],
          claim: {
            unclaimed: true,
          },
        },
      ];

      sandbox.stub(CacheLogic, 'getTips').callsFake(async () => fakeData);

      await TipLogic.updateTipsDB();
      await TipLogic.updateRetipsDB();

      const tip = await Tip.findOne({
        where: {
          id: fakeData[0].id,
        },
      });

      tip.should.have.property('id', fakeData[0].id);
      tip.should.have.property('language', 'en');
      tip.should.have.property('type', TIP_TYPES.AE_TIP);
      tip.should.have.property('unclaimed', true);
      tip.media.should.deep.equal(['http://test']);
      tip.should.have.property('sender', 'ak_tip');
    });

    it('it should CREATE a claimed tip without retips in db', async () => {
      const fakeData = [
        {
          sender: 'ak_tip',
          title: 'test tip in english',
          id: '50',
          url: 'https://superhero.com/',
          retips: [],
          claim: {
            unclaimed: false,
          },
        },
      ];

      sandbox.stub(CacheLogic, 'getTips').callsFake(async () => fakeData);

      await TipLogic.updateTipsDB();
      await TipLogic.updateRetipsDB();

      const tip = await Tip.findOne({
        where: {
          id: fakeData[0].id,
        },
      });

      tip.should.have.property('id', fakeData[0].id);
      tip.should.have.property('language', 'en');
      tip.should.have.property('type', TIP_TYPES.AE_TIP);
      tip.media.should.deep.equal([]);
      tip.should.have.property('unclaimed', fakeData[0].claim.unclaimed);
      tip.should.have.property('sender', 'ak_tip');
    });

    it('it should CREATE a tip with retips in db', async () => {
      const fakeData = [
        {
          sender: 'ak_tip',
          title: 'test tip in english',
          id: '33',
          url: 'https://superhero.com/',
          claim: {
            unclaimed: true,
          },
          retips: [{
            id: '4',
            sender: 'ak_retip',
            timestamp: (new Date(2020, 8, 1)).getTime(),
            claim: {
              unclaimed: true,
            },
          }],
        },
      ];

      sandbox.stub(CacheLogic, 'getTips').callsFake(async () => fakeData);

      await TipLogic.updateTipsDB();
      await TipLogic.updateRetipsDB();

      const tip = await Tip.findOne({
        where: {
          id: fakeData[0].id,
        },
      });

      tip.should.have.property('id', fakeData[0].id);
      tip.should.have.property('language', 'en');
      tip.should.have.property('type', TIP_TYPES.AE_TIP);
      tip.should.have.property('unclaimed', fakeData[0].claim.unclaimed);
      tip.should.have.property('sender', 'ak_tip');

      const retip = await Retip.findOne({
        where: {
          id: fakeData[0].retips[0].id,
        },
      });

      retip.should.have.property('id', fakeData[0].retips[0].id);
      retip.should.have.property('tipId', fakeData[0].id);
      retip.should.have.property('unclaimed', fakeData[0].retips[0].claim.unclaimed);
      retip.should.have.property('sender', 'ak_retip');
    });

    it('it should CREATE retips for an old tip in db', async () => {
      await Tip.create({
        id: '33',
        language: 'en',
        unclaimed: false,
        sender: 'ak_tip',
      });

      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '33',
          url: 'https://superhero.com/',
          claim: {
            unclaimed: false,
          },
          retips: [{
            id: '4',
            sender: 'ak_retip',
            timestamp: (new Date(2020, 8, 1)).getTime(),
            claim: {
              unclaimed: true,
            },
          }],
        },
      ];

      sandbox.stub(CacheLogic, 'getTips').callsFake(async () => fakeData);

      await TipLogic.updateTipsDB();
      await TipLogic.updateRetipsDB();

      const tip = await Tip.findOne({
        where: {
          id: fakeData[0].id,
        },
      });

      tip.should.have.property('id', fakeData[0].id);
      tip.should.have.property('language', 'en');
      tip.should.have.property('type', TIP_TYPES.AE_TIP);
      tip.should.have.property('unclaimed', fakeData[0].claim.unclaimed);
      tip.should.have.property('sender', 'ak_tip');

      const retip = await Retip.findOne({
        where: {
          id: fakeData[0].retips[0].id,
        },
      });

      retip.should.have.property('id', fakeData[0].retips[0].id);
      retip.should.have.property('tipId', fakeData[0].id);
      retip.should.have.property('unclaimed', fakeData[0].retips[0].claim.unclaimed);
      retip.should.have.property('sender', 'ak_retip');
    });

    it('it should UPDATE a tips claimed status db', async () => {
      await Tip.create({
        id: '33',
        language: 'en',
        unclaimed: true,
        sender: 'ak_tip',
      });

      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '33',
          url: 'https://superhero.com/',
          claim: {
            unclaimed: false,
          },
          retips: [],
        },
      ];

      sandbox.stub(CacheLogic, 'getTips').callsFake(async () => fakeData);

      await TipLogic.updateTipsDB();
      await TipLogic.updateRetipsDB();

      const tip = await Tip.findOne({
        where: {
          id: fakeData[0].id,
        },
      });

      tip.should.have.property('id', fakeData[0].id);
      tip.should.have.property('language', 'en');
      tip.should.have.property('type', TIP_TYPES.AE_TIP);
      tip.should.have.property('unclaimed', fakeData[0].claim.unclaimed);
      tip.should.have.property('sender', 'ak_tip');
    });

    it('it should UPDATE a retips claimed status db', async () => {
      await Tip.create({
        id: '33',
        language: 'en',
        unclaimed: true,
        sender: 'ak_tip',
      });
      await Retip.create({
        id: '2',
        tipId: '33',
        unclaimed: true,
        sender: 'ak_retip',
      });

      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '33',
          url: 'https://superhero.com/',
          claim: {
            unclaimed: false,
          },
          retips: [{
            id: '2',
            sender: 'ak_retip',
            claim: {
              unclaimed: false,
            },
          }],
        },
      ];

      sandbox.stub(CacheLogic, 'getTips').callsFake(async () => fakeData);

      await TipLogic.updateTipsDB();
      await TipLogic.updateRetipsDB();

      const tip = await Tip.findOne({
        where: {
          id: fakeData[0].id,
        },
      });

      tip.should.have.property('id', fakeData[0].id);
      tip.should.have.property('language', 'en');
      tip.should.have.property('type', TIP_TYPES.AE_TIP);
      tip.should.have.property('unclaimed', fakeData[0].claim.unclaimed);
      tip.should.have.property('sender', 'ak_tip');

      const retip = await Retip.findOne({
        where: {
          id: fakeData[0].retips[0].id,
        },
      });

      retip.should.have.property('id', fakeData[0].retips[0].id);
      retip.should.have.property('tipId', fakeData[0].id);
      retip.should.have.property('unclaimed', fakeData[0].retips[0].claim.unclaimed);
      retip.should.have.property('sender', 'ak_retip');
    });
  });
});
