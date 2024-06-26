const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');
const { generateKeyPair } = require('@aeternity/aepp-sdk');
const server = require('../../../server');

const { Pin } = require('../../../models');
const {
  publicKey, signChallenge, performSignedJSONRequest, getDBSeedFunction,
} = require('../../../utils/testingUtil');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Pinning', () => {
  const seedDB = getDBSeedFunction([Pin]);

  const testData = {
    entryId: '1_v1',
    type: 'TIP',
  };

  describe('Pinning API', () => {
    it('it should GET 0 pinned entries for a user', done => {
      chai.request(server).get(`/pin/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });

    it('it should reject CREATING a new pin with invalid type', done => {
      performSignedJSONRequest(server, 'post', `/pin/${publicKey}`, { ...testData, type: 'PIN' })
        .then(({ res }) => {
          res.should.have.status(400);
          done();
        });
    });

    it('it should CREATE a new pin via signature auth', done => {
      performSignedJSONRequest(server, 'post', `/pin/${publicKey}`, testData)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('entryId', testData.entryId);
          res.body.should.have.property('type', testData.type);
          res.body.should.have.property('author', publicKey);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('it should GET one pinned tip for a user', async () => {
      await seedDB({
        tips: [{
          id: testData.entryId,
        }],
      }, false);
      const res = await chai.request(server).get(`/pin/${publicKey}`);
      res.should.have.status(200);
      res.body.should.be.a('array');
      res.body.length.should.be.eql(1);
      res.body[0].should.have.property('id', testData.entryId);
    });

    it('it should reject CREATING a new pin as another user', done => {
      const { secretKey } = generateKeyPair();
      chai.request(server).post(`/pin/${publicKey}`)
        .send(testData).end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('challenge');
          const { challenge } = res.body;
          const signature = signChallenge(challenge, secretKey);
          chai.request(server).post(`/pin/${publicKey}`).send({ challenge, signature })
            .end((innerError, innerRes) => {
              innerRes.should.have.status(401);
              done();
            });
        });
    });

    it('it should reject REMOVING a pinned entry from another user', done => {
      const { secretKey, publicKey: localPublicKey } = generateKeyPair();
      performSignedJSONRequest(server, 'delete', `/pin/${publicKey}`, {
        ...testData,
        author: localPublicKey,
      }, secretKey)
        .then(({ res }) => {
          res.should.have.status(401);
          done();
        });
    });

    it('it should REMOVE a pinned entry', done => {
      performSignedJSONRequest(server, 'delete', `/pin/${publicKey}`, testData)
        .then(({ res }) => {
          res.should.have.status(200);
          done();
        });
    });

    it('it should 404 on getting a deleted item', done => {
      chai.request(server).get(`/pin/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });
  });
});
