// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, before } = require('mocha');

const server = require('../../../server');
const { BlacklistEntry, Tip } = require('../../../models');
const ae = require('../../aeternity/logic/aeternity');
const { BLACKLIST_STATUS } = require('../constants/blacklistStates');
const { publicKey, performSignedJSONRequest } = require('../../../utils/testingUtil');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Blacklist', () => {
  before(async () => {
    await BlacklistEntry.truncate();
    await Tip.truncate({
      cascade: true,
    });
  });

  const tipId = '1_v1';
  const walletTipId = '2_v1';

  describe('Blacklist API', () => {
    it('it should GET all the blacklist entries (empty)', done => {
      chai.request(server).get('/blacklist/api').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });

    it('it should REJECT a new blacklist entry via admin auth for unkown id', async () => {
      const res = await chai.request(server).post('/blacklist/api')
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .send({
          tipId,
        });
      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('error', `Tip with id ${tipId} is unknown`);
    });

    it('it should CREATE a new blacklist entry via admin auth', async () => {
      await Tip.create({
        id: tipId,
        title: 'some',
        type: 'AE_TIP',
        contractId: 'ct_test',
        timestamp: 0,
        topics: [],
      });
      const res = await chai.request(server).post('/blacklist/api')
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .send({
          tipId,
        });
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('tipId', String(tipId));
      res.body.should.have.property('status', BLACKLIST_STATUS.HIDDEN);
      res.body.should.have.property('createdAt');
      res.body.should.have.property('updatedAt');
    });

    it('it should CREATE a new blacklist entry via wallet auth', async () => {
      await Tip.create({
        id: walletTipId,
        title: 'some',
        type: 'AE_TIP',
        contractId: 'ct_test',
        timestamp: 0,
        topics: [],
      });
      const { res } = await performSignedJSONRequest(server, 'post', '/blacklist/api/wallet/', {
        tipId: walletTipId, author: publicKey,
      });
      res.should.have.status(200);
    });

    it('it should ALLOW overwriting a blacklist entry via wallet auth', done => {
      performSignedJSONRequest(server, 'post', '/blacklist/api/wallet/', {
        tipId: walletTipId, author: publicKey,
      }).then(({ res }) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('tipId', walletTipId);
        res.body.should.have.property('author', publicKey);
        res.body.should.have.property('status', BLACKLIST_STATUS.FLAGGED);
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        done();
      });
    });

    it('it should GET a single item created via admin auth', done => {
      chai.request(server).get(`/blacklist/api/${tipId}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('tipId', String(tipId));
        res.body.should.have.property('status', BLACKLIST_STATUS.HIDDEN);
        done();
      });
    });

    it('it should GET a single item created via wallet auth', done => {
      chai.request(server).get(`/blacklist/api/${walletTipId}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('tipId', walletTipId);
        res.body.should.have.property('author', publicKey);
        res.body.should.have.property('status', BLACKLIST_STATUS.FLAGGED);
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        done();
      });
    });

    it('it should UPDATE the status to flagged via admin auth', done => {
      chai.request(server).put(`/blacklist/api/${tipId}`)
        .send({
          status: BLACKLIST_STATUS.FLAGGED,
        })
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('it should UPDATE the status to hidden via admin auth', done => {
      chai.request(server).put(`/blacklist/api/${tipId}`)
        .send({
          status: BLACKLIST_STATUS.HIDDEN,
        })
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('it should DELETE a single blacklist entry via admin auth', done => {
      chai.request(server).delete(`/blacklist/api/${tipId}`)
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
    });

    it('it should 404 on getting a deleted item', done => {
      chai.request(server).get(`/blacklist/api/${tipId}`).end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.a('object');
        done();
      });
    });
  });

  describe('Blacklist Frontend', () => {
    before(async function () {
      this.timeout(25000);

      await ae.init();
    });

    it('it should 200 on getting the frontend', function (done) {
      this.timeout(25000);
      chai.request(server).get('/blacklist/').auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});
