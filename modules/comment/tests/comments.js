// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, before } = require('mocha');

const server = require('../../../server');
const {
  Comment, sequelize, Notification, Tip, Retip,
} = require('../../../models');
const { ENTITY_TYPES, NOTIFICATION_TYPES } = require('../../notification/constants/notification');
const { publicKey, performSignedJSONRequest, shouldBeValidChallengeResponse } = require('../../../utils/testingUtil');
const aeternity = require('../../aeternity/logic/aeternity');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Comments', () => {
  const testData = {
    tipId: '0_v1',
    text: 'What an awesome website',
    author: publicKey,
  };

  let commentId = null;

  before(async function () { // Before all tests we empty the database once
    this.timeout(10000);
    await sequelize.models.Commentancestor.destroy({
      where: {},
      truncate: true,
    });

    await Promise.all((await Comment.findAll()).map(
      object => Comment.update({ parentId: null }, { where: { id: object.id } }),
    ));

    await Comment.truncate({
      cascade: true,
    });

    await Notification.truncate();

    await Retip.truncate();

    await Tip.truncate({
      cascade: true,
    });

    await Tip.create({
      id: testData.tipId,
      sender: testData.author,
      title: 'some',
      type: 'AE_TIP',
      contractId: 'ct_test',
      timestamp: 0,
      topics: [],
    });

    await aeternity.init();
  });

  describe('Comment API', () => {
    it('it should return a signature challenge', done => {
      chai.request(server).post('/comment/api').send(testData).end((err, res) => {
        shouldBeValidChallengeResponse(res.body, testData);
        done();
      });
    });

    it('it should CREATE a new comment entry', done => {
      performSignedJSONRequest(server, 'post', '/comment/api', testData).then(({ res, challenge, signature }) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.should.have.property('tipId', testData.tipId);
        res.body.should.have.property('text', testData.text);
        res.body.should.have.property('author', testData.author);
        res.body.should.have.property('challenge', challenge);
        res.body.should.have.property('signature', signature);
        res.body.should.have.property('hidden', false);
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        commentId = res.body.id;

        // SHOULD ALSO CREATE NOTIFICATIONS
        Notification.findOne({
          where: {
            type: NOTIFICATION_TYPES.COMMENT_ON_TIP,
            entityType: ENTITY_TYPES.COMMENT,
            entityId: String(commentId),
            receiver: testData.author,
          },
          raw: true,
        }).then(notification => {
          notification.should.be.a('object');
          done();
        });
      });
    });

    it('it should CREATE a profile with a new comment', done => {
      chai.request(server).get(`/profile/${testData.author}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('author', testData.author);
        res.body.should.have.property('challenge', 'automated-profile');
        res.body.should.have.property('signature', 'automated-profile');
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        done();
      });
    });

    it('it should GET a single item', done => {
      chai.request(server).get(`/comment/api/${commentId}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id', commentId);
        res.body.should.have.property('tipId', testData.tipId);
        res.body.should.have.property('text', testData.text);
        res.body.should.have.property('author', testData.author);
        res.body.should.have.property('challenge');
        res.body.should.have.property('signature');
        res.body.should.have.property('hidden', false);
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        res.body.should.have.property('Profile');
        const profile = res.body.Profile;
        profile.should.have.property('author', testData.author);
        done();
      });
    });

    it('it should GET all items from a thread', done => {
      chai.request(server).get(`/comment/api/tip/${encodeURIComponent(testData.tipId)}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(1);
        res.body[0].should.have.property('id', commentId);
        res.body[0].should.have.property('Profile');
        const profile = res.body[0].Profile;
        profile.should.have.property('author', testData.author);
        done();
      });
    });

    it('it should GET all items for an address', done => {
      chai.request(server).get(`/comment/api/author/${testData.author}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(1);
        res.body[0].should.have.property('id', commentId);
        res.body[0].should.have.property('Profile');
        const profile = res.body[0].Profile;
        profile.should.have.property('author', testData.author);
        done();
      });
    });

    it('it should DELETE a single comment entry', done => {
      performSignedJSONRequest(server, 'delete', `/comment/api/${commentId}`, { author: testData.author })
        .then(({ res }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
    });

    it('it should 404 on getting a deleted item', done => {
      chai.request(server).get(`/comment/api/${commentId}`).end((err, res) => {
        res.should.have.status(404);
        done();
      });
    });
  });

  describe('Recursive Comments', () => {
    let parentComment;

    before(async () => { // Before all tests we empty the database once
      await Comment.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });

      parentComment = await Comment.create({
        tipId: testData.tipId,
        text: 'Parent Comment',
        author: 'ak_testing',
        signature: 'sig',
        challenge: 'chall',
      }, { raw: true });

      const childComment = await Comment.create({
        tipId: testData.tipId,
        text: 'Child Comment',
        author: 'ak_testing',
        signature: 'sig',
        challenge: 'chall',
        parentId: parentComment.id,
      }, { raw: true });

      await Comment.create({
        tipId: testData.tipId,
        text: 'Child Comment',
        author: 'ak_testing',
        signature: 'sig',
        challenge: 'chall',
        parentId: childComment.id,
      }, { raw: true });
    });

    it('it should CREATE a nested comment entry', done => {
      const nestedTestData = { ...testData, parentId: parentComment.id };
      performSignedJSONRequest(server, 'post', '/comment/api', nestedTestData)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.should.have.property('tipId', nestedTestData.tipId);
          res.body.should.have.property('text', nestedTestData.text);
          res.body.should.have.property('author', nestedTestData.author);
          res.body.should.have.property('parentId', nestedTestData.parentId);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('hidden', false);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          commentId = res.body.id;
          // SHOULD ALSO CREATE NOTIFICATIONS
          Notification.findOne({
            where: {
              type: NOTIFICATION_TYPES.COMMENT_ON_TIP,
              entityType: ENTITY_TYPES.COMMENT,
              entityId: String(commentId),
              receiver: testData.author,
            },
            raw: true,
          }).then(notification => {
            notification.should.be.a('object');
            // SHOULD ALSO CREATE NOTIFICATIONS
            Notification.findOne({
              where: {
                type: NOTIFICATION_TYPES.COMMENT_ON_COMMENT,
                entityType: ENTITY_TYPES.COMMENT,
                entityId: String(commentId),
                receiver: 'ak_testing',
              },
              raw: true,
            }).then(secondNotification => {
              secondNotification.should.be.a('object');
              done();
            });
          });
        });
    });

    it('it should REJECT a nested comment entry with a wrong parent id', done => {
      const nestedTestData = { ...testData, parentId: 0 };
      performSignedJSONRequest(server, 'post', '/comment/api', nestedTestData).then(({ res }) => {
        res.should.have.status(500);
        res.text.should.equal(`Could not find parent comment with id ${nestedTestData.parentId}`);
        done();
      });
    });

    it('it should GET children with parent', done => {
      chai.request(server).get(`/comment/api/${parentComment.id}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id', parentComment.id);
        res.body.should.have.property('children');
        res.body.children.should.be.an('array');
        res.body.children.should.have.length(2);
        const child1 = res.body.children[0];
        child1.should.have.property('id', parentComment.id + 1);
        child1.should.have.property('children');
        const childNested = child1.children[0];
        childNested.should.have.property('id', parentComment.id + 2);
        const child2 = res.body.children[1];
        child2.should.have.property('id', parentComment.id + 3);
        done();
      });
    });

    it('it should GET ALL comments with children for a tipId', done => {
      chai.request(server).get(`/comment/api/tip/${testData.tipId}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.should.have.length(4);
        const firstElement = res.body[0];
        firstElement.should.have.property('id', parentComment.id);
        firstElement.should.have.property('children');
        firstElement.children.should.be.an('array');
        firstElement.children.should.have.length(2);
        const child1 = firstElement.children[0];
        child1.should.have.property('id', parentComment.id + 1);
        child1.should.have.property('children');
        const childNested = child1.children[0];
        childNested.should.have.property('id', parentComment.id + 2);
        const child2 = firstElement.children[1];
        child2.should.have.property('id', parentComment.id + 3);
        done();
      });
    });
  });
});
