// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');

const server = require('../server');
const RetipLogic = require('../logic/retipLogic');
const TipLogic = require('../logic/tipLogic');
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
        cascade: true,
      });

      await Notification.destroy({
        where: {},
        truncate: true,
      });

      await Retip.destroy({
        where: {},
        truncate: true,
      });

      await Tip.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });

      createdComment = await Comment.create({
        tipId: '1',
        text: 'Comment',
        author: 'ak_comment',
        signature: 'sig',
        challenge: 'chall',
      }, { raw: true });
    });

    it('it should create notifications for TIP_ON_COMMENT', async () => {
      // Clear DB so retip appears again as new
      await Tip.destroy({
        where: {},
        truncate: true,
      });

      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '1',
          url: `https://superhero.com/tip/1/comment/${createdComment.id}`,
          retips: [],
          claim: {
            unclaimed: true,
          },
          timestamp: (new Date(2020, 8, 1)).getTime(),
        },
      ];

      await TipLogic.updateTipsDB(fakeData);
      await RetipLogic.updateRetipsDB(fakeData);

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
    });

    it('it should create notifications for RETIP_ON_TIP', async () => {
      await Retip.destroy({
        where: {},
        truncate: true,
      });

      await Tip.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });

      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '1',
          url: `https://superhero.com/tip/1/comment/${createdComment.id}`,
          claim: {
            unclaimed: true,
          },
          retips: [{
            id: '1',
            sender: 'ak_retip',
            timestamp: (new Date(2020, 8, 1)).getTime(),
            claim: {
              unclaimed: true,
            },
          }],
        },
      ];

      await TipLogic.updateTipsDB(fakeData);
      await RetipLogic.updateRetipsDB(fakeData);

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
    });

    it('it should create notifications for CLAIM_OF_TIP', async () => {
      await Retip.destroy({
        where: {},
        truncate: true,
      });

      await Tip.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });

      await Tip.create({
        id: '1',
        language: null,
        unclaimed: true,
        sender: 'ak_tip',
      });

      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '1',
          url: `https://superhero.com/tip/1/comment/${createdComment.id}`,
          retips: [{
            id: '1',
            sender: 'ak_retip',
            timestamp: (new Date(2020, 8, 1)).getTime(),
            claim: {
              unclaimed: true,
            },
          }],
          claim: {
            unclaimed: false,
          },
        },
      ];

      await TipLogic.updateTipsDB(fakeData);
      await RetipLogic.updateRetipsDB(fakeData);

      const createdNotification = await Notification.findOne({
        where: {
          type: NOTIFICATION_TYPES.CLAIM_OF_TIP,
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
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.CLAIM_OF_TIP);
    });

    it('it should create notifications for CLAIM_OF_RETIP', async () => {
      await Retip.destroy({
        where: {},
        truncate: true,
      });

      await Tip.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });

      await Tip.create({
        id: '1',
        language: null,
        unclaimed: true,
        sender: 'ak_tip',
      });

      await Retip.create({
        id: '1',
        tipId: '1',
        unclaimed: true,
        sender: 'ak_retip',
      });

      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '1',
          url: `https://superhero.com/tip/1/comment/${createdComment.id}`,
          retips: [{
            id: '1',
            sender: 'ak_retip',
            timestamp: (new Date(2020, 8, 1)).getTime(),
            claim: {
              unclaimed: false,
            },
          }],
          claim: {
            unclaimed: false,
          },
        },
      ];

      await TipLogic.updateTipsDB(fakeData);
      await RetipLogic.updateRetipsDB(fakeData);

      const createdNotification = await Notification.findOne({
        where: {
          type: NOTIFICATION_TYPES.CLAIM_OF_RETIP,
          entityType: ENTITY_TYPES.TIP,
          entityId: '1',
          receiver: 'ak_retip',
        },
        raw: true,
      });
      createdNotification.should.be.a('object');
      createdNotification.should.have.property('receiver', 'ak_retip');
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('entityId', '1');
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.CLAIM_OF_RETIP);
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
      performSignedJSONRequest(server, 'post', `/notification/${createdNotification.id}`, {
        author: publicKey,
        status: NOTIFICATION_STATES.READ,
      })
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
