// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const {
  describe, it, before,
} = require('mocha');

const server = require('../../../server');
const { BlacklistEntry, Tip } = require('../../../models');
const { BLACKLIST_STATUS } = require('../constants/blacklistStates');
const { publicKey, performSignedJSONRequest, getDBSeedFunction } = require('../../../utils/testingUtil');

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
        tipId: walletTipId,
        author: publicKey,
      });
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('tipId', walletTipId);
      res.body.should.have.property('author', publicKey);
      res.body.should.have.property('status', BLACKLIST_STATUS.FLAGGED);
      res.body.should.have.property('signature');
      res.body.should.have.property('challenge');
      res.body.should.have.property('createdAt');
      res.body.should.have.property('updatedAt');
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
        res.body.should.have.property('signature');
        res.body.should.have.property('challenge');
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
        res.body.should.have.property('signature');
        res.body.should.have.property('challenge');
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
    const seedDB = getDBSeedFunction();

    it('it should 200 on getting the frontend', async () => {
      await seedDB({
        tips: [{
          id: '1_v1',
          title: 'test title',
        }],
      }, true);
      const res = await chai.request(server).get('/blacklist/').auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD);
      res.should.have.status(200);
    });

    it('it should be possible to search the blacklist ui', async () => {
      await seedDB({
        tips: [{
          id: '1_v1',
          title: 'test title2',
        }],
      }, true);
      const res = await chai.request(server).get('/blacklist?search=test')
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD);
      res.text.should.contain('<p>test title2</p>');
      res.should.have.status(200);
    });

    it('it should be possible to search the blacklist ui with special chars (+)', async () => {
      await seedDB({
        tips: [{
          id: '1_v1',
          title: 'test title2',
        }],
      }, true);
      const res = await chai.request(server).get('/blacklist?search=test+title2')
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD);
      res.text.should.contain('<p>test title2</p>');
      res.should.have.status(200);
    });

    it('it should show tips only by a certain address', async () => {
      const sender1 = 'ak_TestTestTest';
      const sender2 = 'ak_NotNotNot';
      await seedDB({
        tips: [{
          id: '2_v1',
          title: 'test title2',
          sender: sender1,
        }, {
          id: '3_v1',
          title: 'test title3',
          sender: sender2,
        }],
      }, true);
      const res = await chai.request(server).get(`/blacklist?address=${sender1}`)
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD);
      res.should.have.status(200);
      res.text.should.contain(`<a href="/blacklist?address=${sender1}">${sender1}</a>`);
      res.text.should.not.contain(`<a href="/blacklist?address=${sender2}">${sender2}</a>`);
    });

    it('it should show tip by id', async () => {
      await seedDB({
        tips: [{
          id: '9999_v1',
          title: 'test title4',
        }],
      }, true);
      const res = await chai.request(server).get('/blacklist?id=9999_v1')
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD);
      res.should.have.status(200);
      res.text.should.contain('<a href="/blacklist?id=9999_v1">9999_v1</a>');
    });

    it('it should filter only tips', async () => {
      const tips = new Array(20).fill({}).map((v, i) => (
        {
          id: `${i}_v1`,
          title: `Title ${i}`,
          type: i % 2 === 0 ? 'POST_WITHOUT_TIP' : 'AE_TIP',
          contractId: i % 2 === 0 ? process.env.CONTRACT_V3_ADDRESS : process.env.CONTRACT_V1_ADDRESS,
        }));
      await seedDB({ tips }, true);
      const res = await chai.request(server).get('/blacklist?type=tips')
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD);
      res.text.should.contain('<span>Type: AE_TIP</span>');
      res.text.should.not.contain('<span>Type: POST_WITHOUT_TIP</span>');
      res.should.have.status(200);
    });

    it('it should navigate to second page', async () => {
      const tips = new Array(31).fill({}).map((v, i) => (
        {
          id: `${i}_v1`,
          title: `Title ${i}`,
        }));
      await seedDB({ tips }, true);
      const res = await chai.request(server).get('/blacklist?page=2')
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD);
      res.text.should.contain('<div class="card">');
      res.should.have.status(200);
    });
  });
});
