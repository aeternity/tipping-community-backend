//During the test the env variable is set to test
process.env = {
  ...process.env,
  NODE_URL: 'https://mainnet.aeternal.io',
  COMPILER_URL: 'https://compiler.aepps.com',
  CONTRACT_ADDRESS: 'ct_YpQpntd6fi6r3VXnGW7vJiwPYtiKvutUDY35L4PiqkbKEVRqj',
  AUTHENTICATION_USER: 'admin',
  AUTHENTICATION_PASSWORD: 'pass',
};

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

const { Comment } = require('../utils/database.js');
const { hash, signPersonalMessage, generateKeyPair } = require('@aeternity/aepp-sdk').Crypto;
const { deterministicStringify } = require('../utils/auth.js');

chai.use(chaiHttp);
//Our parent block
describe('Comments', () => {

  const { publicKey, secretKey } = generateKeyPair();

  const testData = {
    tipId: 'https://aeternity.com,1',
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

  before((done) => { //Before all tests we empty the database once
    Comment.destroy({
      where: {},
      truncate: true,
    }).then(() => done());
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
        chai.request(server).post('/comment/api').send({ challenge: challenge.substring(2), signature }).end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('err', 'Could not find challenge');
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
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.should.have.property('tipId', testData.tipId);
          res.body.should.have.property('text', testData.text);
          res.body.should.have.property('author', testData.author);
          res.body.should.have.property('signature', testData.signature);
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
        res.body.should.have.property('signature', testData.signature);
        res.body.should.have.property('hidden', 0);
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

    // PUT
    it('it should update a comment entry', (done) => {
      chai.request(server).put('/comment/api/' + commentId).auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .send({
          hidden: true,
        }).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id', commentId);
        res.body.should.have.property('hidden', 1);
        done();
      });
    });

    it('it should DELETE a single comment entry', (done) => {
      chai.request(server)
        .delete('/comment/api/' + commentId)
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
    });

    it('it should 404 on getting a deleted item', (done) => {
      chai.request(server).get('/comment/api/' + commentId).end((err, res) => {
        res.should.have.status(404);
        done();
      });
    });
  });

});
