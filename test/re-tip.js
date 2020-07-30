const chai = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const aeternity = require('../utils/aeternity');
const CacheLogic = require('../logic/cacheLogic.js');
const TipLogic = require('../logic/tipLogic.js');
const RetipLogic = require('../logic/retipLogic.js');
const { TIP_TYPES } = require('../models/enums/tip');
const { Tip, Retip } = require('../models');

chai.should();

describe('(Re)Tips', () => {
  beforeEach(async () => {
    await Tip.destroy({
      where: {},
      truncate: true,
    });

    await Retip.destroy({
      where: {},
      truncate: true,
    });
  });

  it('should call updateTipsDB on cache renewal', async () => {
    const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => []);
    const updateStub = sinon.stub(TipLogic, 'updateTipsDB').callsFake(() => Promise.resolve());
    await CacheLogic.getTipsAndVerifyLocalInfo();
    updateStub.callCount.should.equal(1);
    updateStub.restore();
    tipStub.restore();
  });

  it('should call updateRetipsDB on cache renewal', async () => {
    const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => []);
    const updateStub = sinon.stub(RetipLogic, 'updateRetipsDB').callsFake(() => Promise.resolve());
    await CacheLogic.getTipsAndVerifyLocalInfo();
    updateStub.callCount.should.equal(1);
    updateStub.restore();
    tipStub.restore();
  });

  it('it should CREATE an unclaimed tip without retips in db', async () => {
    const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => [
      {
        sender: 'ak_tip',
        title: 'test tip in english',
        id: 10,
        url: 'https://superhero.com/',
        retips: [],
        claim: {
          unclaimed: true,
        },
      },
    ]);

    await CacheLogic.getTipsAndVerifyLocalInfo();
    tipStub.restore();

    const tip = await Tip.findOne({
      where: {
        id: 10,
      },
    });

    tip.should.have.property('id', 10);
    tip.should.have.property('language', 'en');
    tip.should.have.property('type', TIP_TYPES.AE_TIP);
    tip.should.have.property('unclaimed', true);
  });

  it('it should CREATE a claimed tip without retips in db', async () => {
    const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => [
      {
        sender: 'ak_tip',
        title: 'test tip in english',
        id: 50,
        url: 'https://superhero.com/',
        retips: [],
        claim: {
          unclaimed: false,
        },
      },
    ]);

    await CacheLogic.getTipsAndVerifyLocalInfo();
    tipStub.restore();

    const tip = await Tip.findOne({
      where: {
        id: 50,
      },
    });

    tip.should.have.property('id', 50);
    tip.should.have.property('language', 'en');
    tip.should.have.property('type', TIP_TYPES.AE_TIP);
    tip.should.have.property('unclaimed', false);
  });

  it('it should CREATE a tip with retips in db', async () => {
    const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => [
      {
        sender: 'ak_tip',
        title: 'test tip in english',
        id: 33,
        url: 'https://superhero.com/',
        claim: {
          unclaimed: true,
        },
        retips: [{
          id: 4,
          sender: 'ak_retip',
          timestamp: (new Date(2020, 8, 1)).getTime(),
          claim: {
            unclaimed: true,
          },
        }],
      },
    ]);

    await CacheLogic.getTipsAndVerifyLocalInfo();
    tipStub.restore();

    const tip = await Tip.findOne({
      where: {
        id: 33,
      },
    });

    tip.should.have.property('id', 33);
    tip.should.have.property('language', 'en');
    tip.should.have.property('type', TIP_TYPES.AE_TIP);
    tip.should.have.property('unclaimed', true);

    const retip = await Retip.findOne({
      where: {
        id: 4,
      },
    });

    retip.should.have.property('id', 4);
    retip.should.have.property('tipId', 33);
    retip.should.have.property('unclaimed', true);
  });

  it('it should CREATE retips for an old tip in db', async () => {
    await Tip.create({
      id: '33',
      language: 'en',
      unclaimed: false,
    });

    const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => [
      {
        sender: 'ak_tip',
        title: '#test tip',
        id: 33,
        url: 'https://superhero.com/',
        claim: {
          unclaimed: false,
        },
        retips: [{
          id: 4,
          sender: 'ak_retip',
          timestamp: (new Date(2020, 8, 1)).getTime(),
          claim: {
            unclaimed: true,
          },
        }],
      },
    ]);

    await CacheLogic.getTipsAndVerifyLocalInfo();
    tipStub.restore();

    const tip = await Tip.findOne({
      where: {
        id: '33',
      },
    });

    tip.should.have.property('id', 33);
    tip.should.have.property('language', 'en');
    tip.should.have.property('type', TIP_TYPES.AE_TIP);
    tip.should.have.property('unclaimed', false);

    const retip = await Retip.findOne({
      where: {
        id: '4',
      },
    });

    retip.should.have.property('id', 4);
    retip.should.have.property('tipId', 33);
    retip.should.have.property('unclaimed', true);
  });

  it('it should UPDATE a tips claimed status db', async () => {
    await Tip.create({
      id: '33',
      language: 'en',
      unclaimed: true,
    });

    const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => [
      {
        sender: 'ak_tip',
        title: '#test tip',
        id: 33,
        url: 'https://superhero.com/',
        claim: {
          unclaimed: false,
        },
        retips: [],
      },
    ]);

    await CacheLogic.getTipsAndVerifyLocalInfo();
    tipStub.restore();

    const tip = await Tip.findOne({
      where: {
        id: '33',
      },
    });

    tip.should.have.property('id', 33);
    tip.should.have.property('language', 'en');
    tip.should.have.property('type', TIP_TYPES.AE_TIP);
    tip.should.have.property('unclaimed', false);
  });

  it('it should UPDATE a retips claimed status db', async () => {
    await Tip.create({
      id: 33,
      language: 'en',
      unclaimed: true,
    });
    await Retip.create({
      id: 2,
      tipId: 33,
      unclaimed: true,
    });

    const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => [
      {
        sender: 'ak_tip',
        title: '#test tip',
        id: 33,
        url: 'https://superhero.com/',
        claim: {
          unclaimed: false,
        },
        retips: [{
          id: 2,
          sender: 'ak_retip',
          claim: {
            unclaimed: false,
          },
        }],
      },
    ]);

    await CacheLogic.getTipsAndVerifyLocalInfo();
    tipStub.restore();

    const tip = await Tip.findOne({
      where: {
        id: '33',
      },
    });

    tip.should.have.property('id', 33);
    tip.should.have.property('language', 'en');
    tip.should.have.property('type', TIP_TYPES.AE_TIP);
    tip.should.have.property('unclaimed', false);

    const retip = await Retip.findOne({
      where: {
        id: 2,
      },
    });

    retip.should.have.property('id', 2);
    retip.should.have.property('tipId', 33);
    retip.should.have.property('unclaimed', false);
  });
});
