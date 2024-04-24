import chai from 'chai';
import chaiHttp from 'chai-http';
import mocha from 'mocha';
import sinon from 'sinon';
import sequelize from 'sequelize';
import server from '../../../server.js';
import {
  publicKey, performSignedGETRequest, performSignedJSONRequest, getDBSeedFunction,
} from '../../../utils/testingUtil.js';
import models from '../../../models/index.js';
import {
  ENTITY_TYPES, NOTIFICATION_TYPES, NOTIFICATION_STATES, SOURCE_TYPES,
} from '../constants/notification.js';

const { describe, it } = mocha;
const { Op } = sequelize;
const { Notification, Comment, Retip } = models;
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
  const seedDB = getDBSeedFunction([Retip, Notification, Comment]);
  after(() => {
    sinon.restore();
  });
  describe('Create Notifications', () => {
    let createdComment = null;
    it('it should create notifications for TIP_ON_COMMENT', async () => {
      const initialFakeData = {
        tips: [
          {
            sender: 'ak_tip',
            title: '#test tip',
            id: '1_v1',
            timestamp: (new Date(2020, 8, 1)).getTime(),
          },
        ],
      };
      await seedDB(initialFakeData);
      createdComment = await Comment.create({
        tipId: '1_v1',
        text: 'Comment',
        author: 'ak_comment',
        signature: 'sig',
        challenge: 'chall',
      }, { raw: true });
      const fakeData = {
        tips: [
          {
            sender: 'ak_tip',
            title: '#test tip',
            id: '2_v1',
            url: `https://superhero.com/tip/1_v1/comment/${createdComment.id}`,
            timestamp: (new Date(2020, 8, 1)).getTime(),
          },
        ],
      };
      await seedDB(fakeData, false);
      const createdNotification = await Notification.findOne({
        where: {
          type: NOTIFICATION_TYPES.TIP_ON_COMMENT,
          entityType: ENTITY_TYPES.TIP,
          entityId: fakeData.tips[0].id,
          receiver: createdComment.author,
          sender: fakeData.tips[0].sender,
          sourceType: SOURCE_TYPES.COMMENT,
          sourceId: String(createdComment.id),
        },
        raw: true,
      });
      createdNotification.should.be.a('object');
      createdNotification.should.have.property('receiver', 'ak_comment');
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('sender', fakeData.tips[0].sender);
      createdNotification.should.have.property('entityId', fakeData.tips[0].id);
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.TIP_ON_COMMENT);
      createdNotification.should.have.property('sourceType', SOURCE_TYPES.COMMENT);
      createdNotification.should.have.property('sourceId', String(createdComment.id));
    });
    it('it should create notifications for RETIP_ON_TIP', async () => {
      const fakeData = {
        tips: [{
          id: '1_v1',
          sender: 'ak_tip',
        }],
        retips: [{
          id: '1_v1',
          tipId: '1_v1',
          sender: 'ak_retip',
          timestamp: (new Date(2020, 8, 1)).getTime(),
        }],
      };
      await seedDB(fakeData);
      const createdNotification = await Notification.findOne({
        where: {
          type: NOTIFICATION_TYPES.RETIP_ON_TIP,
          entityType: ENTITY_TYPES.TIP,
          entityId: fakeData.tips[0].id,
          receiver: fakeData.tips[0].sender,
          sender: fakeData.retips[0].sender,
        },
        raw: true,
      });
      createdNotification.should.be.a('object');
      createdNotification.should.have.property('receiver', fakeData.tips[0].sender);
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('sender', fakeData.retips[0].sender);
      createdNotification.should.have.property('entityId', fakeData.tips[0].id);
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.RETIP_ON_TIP);
    });
    it('it should create notifications for CLAIM_OF_TIP', async () => {
      const initialFakeData = {
        tips: [{
          id: '1_v1',
          sender: 'ak_tip',
          url: 'example.com',
          claimGen: 0,
        }],
        claims: [{
          claimGen: 0,
          url: 'example.com',
          amount: 1,
        }],
      };
      await seedDB(initialFakeData);
      const fakeData = {
        claims: [{
          claimGen: 1,
          url: 'example.com',
          amount: 0,
        }],
      };
      await seedDB(fakeData, false);
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
      createdNotification.should.have.property('receiver', initialFakeData.tips[0].sender);
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('entityId', initialFakeData.tips[0].id);
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.CLAIM_OF_TIP);
    });
    it('it should create notifications for CLAIM_OF_RETIP', async () => {
      const initialFakeData = {
        tips: [{
          id: '1_v1',
          sender: 'ak_tip',
          url: 'example.com',
          claimGen: 0,
        }],
        retips: [{
          id: '1_v1',
          tipId: '1_v1',
          sender: 'ak_retip',
          claimGen: 0,
        }],
        claims: [{
          claimGen: 0,
          url: 'example.com',
          amount: 1,
        }],
      };
      await seedDB(initialFakeData);
      const fakeData = {
        claims: [{
          claimGen: 1,
          url: 'example.com',
          amount: 0,
        }],
      };
      await seedDB(fakeData, false);
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
      createdNotification.should.have.property('receiver', initialFakeData.retips[0].sender);
      createdNotification.should.have.property('entityType', ENTITY_TYPES.TIP);
      createdNotification.should.have.property('entityId', initialFakeData.retips[0].id);
      createdNotification.should.have.property('type', NOTIFICATION_TYPES.CLAIM_OF_RETIP);
    });
    it('it should not crash on further claims', async () => {
      const initialFakeData = {
        tips: [{
          id: '1_v1',
          sender: 'ak_tip',
          url: 'example.com',
          claimGen: 0,
        }],
        retips: [{
          id: '1_v1',
          tipId: '1_v1',
          sender: 'ak_retip',
          claimGen: 0,
        }],
        claims: [{
          claimGen: 0,
          url: 'example.com',
          amount: 1,
        }],
      };
      await seedDB(initialFakeData);
      const fakeData = {
        claims: [{
          claimGen: 1,
          url: 'example.com',
          amount: 0,
        }],
      };
      await seedDB(fakeData, false);
      const fakeData2 = {
        claims: [{
          claimGen: 2,
          url: 'example.com',
          amount: 0,
        }],
      };
      await seedDB(fakeData2, false);
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
    it('it should MODIFY a single notification for a user', async () => {
      // eslint-disable-next-line no-restricted-syntax,guard-for-in
      for (const notificationState of Object.values(NOTIFICATION_STATES)) {
        // eslint-disable-next-line no-await-in-loop
        const { res } = await performSignedJSONRequest(server, 'post', `/notification/${createdNotification.id}`, {
          author: publicKey,
          status: notificationState,
        });
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('receiver', publicKey);
        res.body.should.have.property('entityId', '0');
        res.body.should.have.property('entityType', ENTITY_TYPES.COMMENT);
        res.body.should.have.property('type', NOTIFICATION_TYPES.COMMENT_ON_COMMENT);
        res.body.should.have.property('status', notificationState);
      }
    });
    it('it should MODIFY a batch of notifications for a user', async () => {
      // eslint-disable-next-line no-restricted-syntax,guard-for-in
      for (const notificationState of Object.values(NOTIFICATION_STATES)) {
        // eslint-disable-next-line no-await-in-loop
        const { res } = await performSignedJSONRequest(server, 'post', '/notification/', {
          author: publicKey,
          status: notificationState,
          ids: [createdNotification.id, createdNotification2.id],
        });
        res.should.have.status(200);
        res.body.should.have.length(2);
        res.body.should.contain(createdNotification.id);
        res.body.should.contain(createdNotification2.id);
        // eslint-disable-next-line no-await-in-loop
        const dbNotifications = await Notification.findAll({
          attributes: ['id', 'status'],
          where: {
            id: {
              [Op.in]: [createdNotification.id, createdNotification2.id],
            },
          },
          raw: true,
        });
        dbNotifications.should.be.a('array');
        dbNotifications.filter(({ status }) => status === notificationState).should.have.length(2);
      }
    });
  });
});
