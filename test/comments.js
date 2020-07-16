// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, before } = require('mocha');

const server = require('../server');
const { Comment, sequelize } = require('../models');
const { publicKey, performSignedJSONRequest, shouldBeValidChallengeResponse } = require('../utils/testingUtil');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Comments', () => {
  const testData = {
    tipId: 0,
    text: 'What an awesome website',
    author: publicKey,
  };

  let commentId = null;

  before(async () => { // Before all tests we empty the database once
    await sequelize.models.Commentancestor.destroy({
      where: {},
      truncate: true,
    });

    await Promise.all((await Comment.findAll()).map(
      object => Comment.update({ parentId: null }, { where: { id: object.id } }),
    ));

    await Comment.destroy({
      where: {},
      truncate: true,
    });
  });

  describe('Comment API', () => {
    it('it should GET an empty array of comments for tips', done => {
      chai.request(server).get('/comment/api/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });

    it('it should GET a 0 count of comments for tips', done => {
      chai.request(server).get('/comment/count/tips/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });

    it(`it should GET a 0 count of comments for address ${publicKey}`, done => {
      chai.request(server).get(`/comment/count/author/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('count', 0);
        res.body.should.have.property('author', publicKey);
        done();
      });
    });

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
        done();
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

    it('it should GET a count of comments for tips', done => {
      chai.request(server).get('/comment/count/tips/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.eql(1);
        res.body[0].should.have.property('count', 1);
        res.body[0].should.have.property('tipId', testData.tipId);
        done();
      });
    });

    it(`it should GET a count of comments for address${publicKey}`, done => {
      chai.request(server).get(`/comment/count/author/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('count', 1);
        res.body.should.have.property('author', publicKey);
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
      });

      parentComment = await Comment.create({
        tipId: 0,
        text: 'Parent Comment',
        author: 'ak_testing',
        signature: 'sig',
        challenge: 'chall',
      }, { raw: true });

      const childComment = await Comment.create({
        tipId: 0,
        text: 'Child Comment',
        author: 'ak_testing',
        signature: 'sig',
        challenge: 'chall',
        parentId: parentComment.id,
      }, { raw: true });

      await Comment.create({
        tipId: 0,
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
          console.log(res.text);
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
          done();
        });
    });

    it('it should REJECT a nested comment entry with a wrong parent id', done => {
      const nestedTestData = { ...testData, parentId: 0 };
      performSignedJSONRequest(server, 'post', '/comment/api', nestedTestData).then(({ res }) => {
        res.should.have.status(400);
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
      chai.request(server).get('/comment/api/tip/0').end((err, res) => {
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
