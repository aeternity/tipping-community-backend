// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');

const server = require('../server');
const { publicKey, performSignedGETRequest, performSignedJSONRequest } = require('../utils/testingUtil');
const { Notification } = require('../models');
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
