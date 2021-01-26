// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');
const sinon = require('sinon');

const server = require('../../../server');
const TipLogic = require('../../tip/logic/tipLogic');
const CacheLogic = require('../../cache/logic/cacheLogic');
const { publicKey, performSignedGETRequest, performSignedJSONRequest } = require('../../../utils/testingUtil');
const {
  Notification, Comment, Tip, Retip,
} = require('../../../models');
const {
  ENTITY_TYPES, NOTIFICATION_TYPES, NOTIFICATION_STATES, SOURCE_TYPES,
} = require('../constants/notification');

chai.should();
chai.use(chaiHttp);

describe('Notifications', () => {
  const testData = {
    receiver: publicKey,
    entityId: 0,
    sender: 'ak_sender',
    entityType: ENTITY_TYPES.COMMENT,
    type: NOTIFICATION_TYPES.COMMENT_ON_COMMENT,
  };
  let sandbox;

  const fakeTipsAndUpdateDB = async fakeData => {
    sandbox.stub(CacheLogic, 'getTips').callsFake(async () => fakeData);
    await TipLogic.updateTipsDB();
    await TipLogic.updateRetipsDB();
  };

  describe('Create Notifications', () => {
    let createdComment = null;
    beforeEach(async () => {
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
        tipId: '1_v1',
        text: 'Comment',
        author: 'ak_comment',
        signature: 'sig',
        challenge: 'chall',
      }, { raw: true });

      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('it should create notifications for TIP_ON_COMMENT', async () => {
      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '1_v1',
          url: `https://superhero.com/tip/1_v1/comment/${createdComment.id}`,
          retips: [],
          claim: {
            unclaimed: true,
          },
          timestamp: (new Date(2020, 8, 1)).getTime(),
        },
      ];

      await fakeTipsAndUpdateDB(fakeData);

      const createdNotification = await Notification.findOne({
        where: {
          type: NOTIFICATION_TYPES.TIP_ON_COMMENT,
          entityType: ENTITY_TYPES.TIP,
          entityId: fakeData[0].id,
          receiver: createdComment.author,
          sender: fakeData[0].sender,
          sourceType: SOURCE_TYPES.COMMENT,
          sourceId: String(createdComment.id),
        },
        raw: true,
      });

      createdNotification.should.be.a('object');
      createdNotification.should.have.property('receiver', 'ak_comment');
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('sender', fakeData[0].sender);
      createdNotification.should.have.property('entityId', fakeData[0].id);
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.TIP_ON_COMMENT);
      createdNotification.should.have.property('sourceType', SOURCE_TYPES.COMMENT);
      createdNotification.should.have.property('sourceId', String(createdComment.id));
    });

    it('it should create notifications for RETIP_ON_TIP', async () => {
      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '1_v1',
          url: `https://superhero.com/tip/1_v1/comment/${createdComment.id}`,
          claim: {
            unclaimed: true,
          },
          retips: [{
            id: '1_v1',
            sender: 'ak_retip',
            timestamp: (new Date(2020, 8, 1)).getTime(),
            claim: {
              unclaimed: true,
            },
          }],
        },
      ];

      await fakeTipsAndUpdateDB(fakeData);

      const createdNotification = await Notification.findOne({
        where: {
          type: NOTIFICATION_TYPES.RETIP_ON_TIP,
          entityType: ENTITY_TYPES.TIP,
          entityId: fakeData[0].id,
          receiver: fakeData[0].sender,
          sender: fakeData[0].retips[0].sender,
        },
        raw: true,
      });
      createdNotification.should.be.a('object');
      createdNotification.should.have.property('receiver', fakeData[0].sender);
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('sender', fakeData[0].retips[0].sender);
      createdNotification.should.have.property('entityId', fakeData[0].id);
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.RETIP_ON_TIP);
    });

    it('it should create notifications for CLAIM_OF_TIP', async () => {
      await Tip.create({
        id: '1_v1',
        language: null,
        unclaimed: true,
        sender: 'ak_tip',
      });

      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '1_v1',
          url: `https://superhero.com/tip/1_v1/comment/${createdComment.id}`,
          retips: [{
            id: '1_v1',
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

      await fakeTipsAndUpdateDB(fakeData);

      const createdNotification = await Notification.findOne({
        where: {
          type: NOTIFICATION_TYPES.CLAIM_OF_TIP,
          entityType: ENTITY_TYPES.TIP,
          entityId: '1_v1',
          receiver: 'ak_tip',
        },
        raw: true,
      });

      createdNotification.should.be.a('object');
      createdNotification.should.have.property('receiver', fakeData[0].sender);
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('entityId', fakeData[0].id);
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.CLAIM_OF_TIP);
    });

    it('it should create notifications for CLAIM_OF_RETIP', async () => {
      await Tip.create({
        id: '1_v1',
        language: null,
        unclaimed: true,
        sender: 'ak_tip',
      });

      await Retip.create({
        id: '1_v1',
        tipId: '1_v1',
        unclaimed: true,
        sender: 'ak_retip',
      });

      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '1_v1',
          url: `https://superhero.com/tip/1/comment/${createdComment.id}`,
          retips: [{
            id: '1_v1',
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

      await fakeTipsAndUpdateDB(fakeData);

      const createdNotification = await Notification.findOne({
        where: {
          type: NOTIFICATION_TYPES.CLAIM_OF_RETIP,
          entityType: ENTITY_TYPES.TIP,
          entityId: '1_v1',
          receiver: 'ak_retip',
        },
        raw: true,
      });
      createdNotification.should.be.a('object');
      createdNotification.should.have.property('receiver', fakeData[0].retips[0].sender);
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('entityId', fakeData[0].id);
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.CLAIM_OF_RETIP);
    });

    it('it should not crash if tips are resynced', async () => {
      await Notification.create({
        type: NOTIFICATION_TYPES.RETIP_ON_TIP,
        entityType: ENTITY_TYPES.TIP,
        entityId: '1_v1',
        receiver: 'ak_tip',
        sourceType: SOURCE_TYPES.RETIP,
        sourceId: '1_v1',
      });

      const fakeData = [
        {
          sender: 'ak_tip',
          title: '#test tip',
          id: '1_v1',
          url: `https://superhero.com/tip/1_v1/comment/${createdComment.id}`,
          retips: [{
            id: '1_v1',
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

      await fakeTipsAndUpdateDB(fakeData);
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
            res.body[0].should.have.property('sender', testData.sender);
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
    let createdNotification2;
    before(async () => {
      await Notification.destroy({
        where: {},
        truncate: true,
      });
      createdNotification = await Notification.create(testData);
      createdNotification2 = await Notification.create(testData);
    });

    it('it should MODIFY a single notification for a user', done => {
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

    it('it should MODIFY a batch of notifications for a user', done => {
      performSignedJSONRequest(server, 'post', '/notification/', {
        author: publicKey,
        status: NOTIFICATION_STATES.CREATED,
        ids: [createdNotification.id, createdNotification2.id],
      })
        .then(async ({ res }) => {
          res.should.have.status(200);
          res.body.should.have.length(2);
          res.body.should.contain(createdNotification.id);
          res.body.should.contain(createdNotification2.id);
          const dbNotification = await Notification.findOne({
            where: {
              id: createdNotification.id,
            },
            raw: true,
          });
          dbNotification.should.be.a('object');
          dbNotification.should.have.property('status', NOTIFICATION_STATES.CREATED);

          const dbNotification2 = await Notification.findOne({
            where: {
              id: createdNotification2.id,
            },
            raw: true,
          });
          dbNotification2.should.be.a('object');
          dbNotification2.should.have.property('status', NOTIFICATION_STATES.CREATED);
          done();
        });
    });
  });
});
