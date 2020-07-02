const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();

const { Pin } = require('../models');
const { publicKey, signChallenge, performSignedJSONRequest } = require('../utils/testingUtil');
const { generateKeyPair } = require('@aeternity/aepp-sdk').Crypto;

chai.use(chaiHttp);
//Our parent block
describe('Pinning', () => {
  before((done) => { //Before each test we empty the database
    Pin.destroy({
      where: {},
      truncate: true,
    }).then(() => done());
  });

  const testData = {
    entryId: 1,
    type: 'TIP',
  };

  describe('Pinning API', () => {
    it('it should GET 0 pinned entries for a user', (done) => {
      chai.request(server).get('/pin/' + publicKey).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });

    let createdEntry = {};

    it('it should CREATE a new pin via signature auth', (done) => {
      performSignedJSONRequest(server, 'post', '/pin/' + publicKey, testData)
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
          createdEntry = res.body;
          done();
        });
    });

    it('it should GET one pinned entry for a user', (done) => {
      chai.request(server).get('/pin/' + publicKey).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(1);
        res.body[0].should.have.property('entryId', String(testData.entryId));
        done();
      });
    });

    it('it should reject CREATING a new pin as another user', (done) => {
      const { secretKey} = generateKeyPair();
      chai.request(server).post('/pin/' + publicKey)
        .send(testData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge, secretKey);
        chai.request(server).post('/pin/' + publicKey).send({ challenge, signature }).end((err, res) => {
          res.should.have.status(401);
          done();
        });
      });
    });


    it('it should reject REMOVING a pinned entry from another user', (done) => {
      const {secretKey, publicKey:localPublicKey} = generateKeyPair();
      performSignedJSONRequest(server, 'delete', '/pin/' + publicKey, { ...testData, author: localPublicKey }, secretKey)
        .then(({ res }) => {
          console.log(res.text)
          res.should.have.status(401);
          done();
        });
    });

    it('it should REMOVE a pinned entry', (done) => {
      performSignedJSONRequest(server, 'delete', '/pin/' + publicKey, testData)
        .then(({ res }) => {
          console.log(res.body)
          res.should.have.status(200);
          done();
        });
    });


    it('it should 404 on getting a deleted item', (done) => {
      chai.request(server).get('/pin/' + publicKey).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });
  });

});
