//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

const { Comment, sequelize } = require('../models');
const { signPersonalMessage, generateKeyPair } = require('@aeternity/aepp-sdk').Crypto;

chai.use(chaiHttp);
//Our parent block
describe('Comments', () => {

  const { publicKey, secretKey } = generateKeyPair();

  const testData = {
    tipId: 1,
    text: 'What an awesome website',
    author: publicKey,
  };

  let commentId = null;

  const signChallenge = (challenge) => {
    const signatureBuffer = signPersonalMessage(
      challenge,
      Buffer.from(secretKey, 'hex'),
    );
    return Buffer.from(signatureBuffer).toString('hex');
  };

  before(async function () { //Before all tests we empty the database once
    await sequelize.models.Commentancestor.destroy({
      where: {},
      truncate: true,
    });

    await Promise.all((await Comment.findAll()).map(object => {
      return Comment.update({ parentId: null }, { where: { id: object.id }});
    }));

    await Comment.destroy({
      where: {},
      truncate: true,
    });
  });

  describe('Comment API', () => {
    it('it should GET all the comment entries (empty)', (done) => {
      chai.request(server).get('/comment/api').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });

    it('it should GET a 0 count of comments for tips', (done) => {
      chai.request(server).get('/comment/count/tips/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });

    it('it should GET a 0 count of comments for address ' + publicKey, (done) => {
      chai.request(server).get('/comment/count/author/' + publicKey).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('count', 0);
        res.body.should.have.property('author', publicKey);
        done();
      });
    });

    it('it should return a signature challenge', (done) => {
      chai.request(server).post('/comment/api').send(testData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        done();
      });
    });

    it('it should fail with invalid signature', (done) => {
      chai.request(server).post('/comment/api').send(testData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        chai.request(server).post('/comment/api').send({ challenge, signature: 'wrong' }).end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('err', 'bad signature size');
          done();
        });
      });
    });

    it('it should fail on invalid challenge', (done) => {
      chai.request(server).post('/comment/api').send(testData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge);
        chai.request(server).post('/comment/api').send({
          challenge: challenge.substring(2),
          signature,
        }).end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('err', 'Could not find challenge (maybe it already expired?)');
          done();
        });
      });
    });

    it('it should CREATE a new comment entry', (done) => {
      chai.request(server).post('/comment/api').send(testData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge);
        chai.request(server).post('/comment/api').send({ challenge: challenge, signature }).end((err, res) => {
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
    });

    it('it should GET a single item', (done) => {
      chai.request(server).get('/comment/api/' + commentId).end((err, res) => {
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
        done();
      });
    });

    it('it should GET all items from a thread', (done) => {
      chai.request(server).get('/comment/api/tip/' + encodeURIComponent(testData.tipId)).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(1);
        done();
      });
    });

    it('it should GET a count of comments for tips', (done) => {
      chai.request(server).get('/comment/count/tips/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.eql(1);
        res.body[0].should.have.property('count', 1);
        res.body[0].should.have.property('tipId', testData.tipId);
        done();
      });
    });

    it('it should GET a count of comments for address' + publicKey, (done) => {
      chai.request(server).get('/comment/count/author/' + publicKey).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('count', 1);
        res.body.should.have.property('author', publicKey);
        done();
      });
    });

    it('it should DELETE a single comment entry', (done) => {
      chai.request(server)
        .delete('/comment/api/' + commentId)
        .send({ author: testData.author })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('challenge');
          const challenge = res.body.challenge;
          const signature = signChallenge(challenge);
          chai.request(server).delete('/comment/api/' + commentId).send({
            challenge: challenge,
            signature,
          }).end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            done();
          });
        });
    });

    it('it should 404 on getting a deleted item', (done) => {
      chai.request(server).get('/comment/api/' + commentId).end((err, res) => {
        res.should.have.status(404);
        done();
      });
    });
  });
  describe('Recursive Comments', () => {

    let parentComment;

    before(async function () { //Before all tests we empty the database once
      await Comment.destroy({
        where: {},
        truncate: true,
      });

      parentComment = await Comment.create({
        tipId: 1,
        text: 'Parent Comment',
        author: 'ak_testing',
        signature: 'sig',
        challenge: 'chall',
      }, { raw: true });

      const childComment = await Comment.create({
        tipId: 1,
        text: 'Child Comment',
        author: 'ak_testing',
        signature: 'sig',
        challenge: 'chall',
        parentId: parentComment.id,
      }, { raw: true });

      const childComment2 = await Comment.create({
        tipId: 1,
        text: 'Child Comment',
        author: 'ak_testing',
        signature: 'sig',
        challenge: 'chall',
        parentId: childComment.id,
      }, { raw: true });
    });

    it('it should CREATE a nested comment entry', (done) => {
      const nestedTestData = Object.assign({}, testData, { parentId: parentComment.id });
      chai.request(server).post('/comment/api').send(nestedTestData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge);
        chai.request(server).post('/comment/api').send({ challenge: challenge, signature }).end((err, res) => {
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
    });

    it('it should REJECT a nested comment entry with a wrong parent id', (done) => {
      const nestedTestData = Object.assign({}, testData, { parentId: 0 });
      chai.request(server).post('/comment/api').send(nestedTestData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge);
        chai.request(server).post('/comment/api').send({ challenge: challenge, signature }).end((err, res) => {
          res.should.have.status(400);
          res.body.err.should.equal('Could not find parent comment with id ' + nestedTestData.parentId);
          done();
        });
      });
    });

    it('it should GET children with parent', (done) => {
      chai.request(server).get('/comment/api/' + parentComment.id).end((err, res) => {
        res.should.have.status(200);
        console.log(res.body);
        res.body.should.be.a('object');
        res.body.should.have.property('id', parentComment.id);
        res.body.should.have.property('children');
        res.body.children.should.be.an('array');
        res.body.children.should.have.length(2);
        const child1 = res.body.children[0];
        child1.should.have.property('id', parentComment.id + 1);
        child1.should.have.property('children');
        const child_nested = child1.children[0];
        child_nested.should.have.property('id', parentComment.id + 2);
        const child2 = res.body.children[1];
        child2.should.have.property('id', parentComment.id + 3);
        done();
      });
    });
  });
});
