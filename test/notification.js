// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { describe, it } = require('mocha');

const server = require('../server');
const aeternity = require('../utils/aeternity');
const CacheLogic = require('../logic/cacheLogic');
const { publicKey, performSignedGETRequest, performSignedJSONRequest } = require('../utils/testingUtil');
const {
  Notification, Comment, Tip, Retip,
} = require('../models');
const { ENTITY_TYPES, NOTIFICATION_TYPES, NOTIFICATION_STATES } = require('../models/enums/notification');

chai.should();
chai.use(chaiHttp);

describe('Notifications', () => {
  const testData = {
    receiver: publicKey,
    entityId: 0,
    entityType: ENTITY_TYPES.COMMENT,
    type: NOTIFICATION_TYPES.COMMENT_ON_COMMENT,
  };

  describe('Create Notifications', () => {
    let createdComment = null;
    before(async () => {
      await Comment.destroy({
        where: {},
        truncate: true,
      });

      await Notification.destroy({
        where: {},
        truncate: true,
      });

      await Tip.destroy({
        where: {},
        truncate: true,
      });

      await Retip.destroy({
        where: {},
        truncate: true,
      });

      createdComment = await Comment.create({
        tipId: 1,
        text: 'Comment',
        author: 'ak_comment',
        signature: 'sig',
        challenge: 'chall',
      }, { raw: true });
    });

    it('it should create notifications for TIP_ON_COMMENT', async () => {
      const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: 1,
          url: `https://superhero.com/tip/1/comment/${createdComment.id}`,
          retips: [],
        },
      ]);

      await CacheLogic.getTipsAndVerifyLocalInfo();

      tipStub.callCount.should.eql(1);
      const createdNotification = await Notification.findOne({
        where: {
          type: NOTIFICATION_TYPES.TIP_ON_COMMENT,
          entityType: ENTITY_TYPES.TIP,
          entityId: '1',
          receiver: 'ak_comment',
        },
        raw: true,
      });
      createdNotification.should.be.a('object');
      createdNotification.should.have.property('receiver', 'ak_comment');
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('entityId', '1');
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.TIP_ON_COMMENT);

      tipStub.restore();
    });

    it('it should not create notifications for RETIP_ON_TIP if the tip is old', async () => {
      const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => [
        {
          sender: 'ak_tip_old',
          title: '#test tip',
          id: 1,
          url: `https://superhero.com/tip/1/comment/${createdComment.id}`,
          retips: [{
            sender: 'ak_retip',
            timestamp: (new Date(2020, 5, 1)).getTime(),
          }],
        },
      ]);

      await CacheLogic.getTipsAndVerifyLocalInfo();

      tipStub.callCount.should.eql(1);
      const emptyArray = await Notification.findAll({
        where: {
          type: NOTIFICATION_TYPES.RETIP_ON_TIP,
        },
        raw: true,
      });
      emptyArray.should.have.length(0);
      tipStub.restore();
    });

    it('it should create notifications for RETIP_ON_TIP', async () => {
      const tipStub = sinon.stub(aeternity, 'getTips').callsFake(() => [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: 1,
          url: `https://superhero.com/tip/1/comment/${createdComment.id}`,
          retips: [{
            sender: 'ak_retip',
            timestamp: (new Date(2020, 8, 1)).getTime(),
          }],
        },
      ]);

      await CacheLogic.getTipsAndVerifyLocalInfo();

      tipStub.callCount.should.eql(1);
      const createdNotification = await Notification.findOne({
        where: {
          type: NOTIFICATION_TYPES.RETIP_ON_TIP,
          entityType: ENTITY_TYPES.TIP,
          entityId: '1',
          receiver: 'ak_tip',
        },
        raw: true,
      });
      createdNotification.should.be.a('object');
      createdNotification.should.have.property('receiver', 'ak_tip');
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('entityId', '1');
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.RETIP_ON_TIP);

      tipStub.restore();
    });
  });

  describe('Retrieve Notifications', () => {
    it('it should GET zero notifications for a user', done => {
      performSignedGETRequest(server, `/notification/user/${publicKey}`)
        .then(({ res }) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.should.have.length(0);
          done();
        });
    });

    it('it should GET a single notifications for a user', done => {
      Notification.create(testData).then(() => {
        performSignedGETRequest(server, `/notification/user/${publicKey}`)
          .then(({ res }) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.should.have.length(1);
            res.body[0].should.have.property('receiver', publicKey);
            res.body[0].should.have.property('entityId', '0');
            res.body[0].should.have.property('entityType', ENTITY_TYPES.COMMENT);
            res.body[0].should.have.property('type', NOTIFICATION_TYPES.COMMENT_ON_COMMENT);
            res.body[0].should.have.property('status', NOTIFICATION_STATES.CREATED);
            done();
          });
      });
    });
  });
  describe('Modify Notifications', () => {
    let createdNotification;
    before(async () => {
      await Notification.destroy({
        where: {},
        truncate: true,
      });
      createdNotification = await Notification.create(testData);
    });

    it('it should MODIFY a single notifications for a user', done => {
      performSignedJSONRequest(server, 'post', `/notification/${createdNotification.id}`, { author: publicKey, status: NOTIFICATION_STATES.READ })
        .then(({ res }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('receiver', publicKey);
          res.body.should.have.property('entityId', '0');
          res.body.should.have.property('entityType', ENTITY_TYPES.COMMENT);
          res.body.should.have.property('type', NOTIFICATION_TYPES.COMMENT_ON_COMMENT);
          res.body.should.have.property('status', NOTIFICATION_STATES.READ);
          done();
        });
    });
  });

  describe('Static Types', () => {
    before(async () => {
      await Notification.destroy({
        where: {},
        truncate: true,
      });
    });

    it('it should GET all static notification types', done => {
      chai.request(server).get('/notification/static/types').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('ENTITY_TYPES');
        res.body.should.have.property('NOTIFICATION_TYPES');
        res.body.should.have.property('NOTIFICATION_STATES');
        res.body.ENTITY_TYPES.should.deep.equal(ENTITY_TYPES);
        res.body.NOTIFICATION_TYPES.should.deep.equal(NOTIFICATION_TYPES);
        res.body.NOTIFICATION_STATES.should.deep.equal(NOTIFICATION_STATES);
        done();
      });
    });
  });
});
