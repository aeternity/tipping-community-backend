//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
const cache = require('../utils/cache');
const sinon = require('sinon');
const CacheLogic = require('../logic/cacheLogic.js');

chai.use(chaiHttp);
//Our parent block
describe('Cache', () => {

  before(async function () {
    this.timeout(20000);
    await cache.del(['getTips']);
    await cache.del(['fetchPrice']);
    await cache.del(['getChainNames']);
    await cache.del(['oracleState']);
  });

  const checkCachedRoute = (route, type, done) => {
    chai.request(server).get(route).end((err, res) => {
      res.should.have.status(200);
      res.body.should.be.a(type);
      done();
    });
  };
  const minimalTimeout = 200;

  describe('API', () => {

    it('it should GET all cache items', function (done) {
      this.timeout(20000);
      checkCachedRoute('/cache/tips', 'array', done);
    });

    it('it should GET all cache items with search', async () => {


      const stub = sinon.stub(CacheLogic, 'getAllTips').callsFake(function () {
        return [
          {
            "amount": "1000000000000000000",
            "claim_gen": 30,
            "sender": "ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag",
            "timestamp": 1588180804130,
            "title": "#test tip",
            "url_id": 0,
            "id": 1,
            "url": "https://github.com/thepiwo",
            "topics": [
              "#test"
            ],
            "retips": [],
            "claim": {
              "unclaimed": false,
              "claim_gen": 36,
              "unclaimed_amount": 0
            },
            "amount_ae": "1",
            "retip_amount_ae": "1",
            "total_amount": "2",
            "total_unclaimed_amount": "0",
            "total_claimed_amount": "2",
            "score": 0.0009784764534533858,
            "preview": {
              "id": 1034,
              "requestUrl": "https://github.com/thepiwo",
              "title": "thepiwo - Overview",
              "description": "Blockchain Engineer / Full-Stack Developer justaverylongtestingname.chain - thepiwo",
              "image": "/linkpreview/image/compressed-preview-2811cb26-82e8-4fb6-b755-14e636fff9ae.jpg",
              "responseUrl": "https://github.com/thepiwo",
              "lang": "en",
              "querySucceeded": 1,
              "failReason": null,
              "createdAt": "2020-04-06 12:45:37.475 +00:00",
              "updatedAt": "2020-04-06 12:45:37.475 +00:00"
            },
            "chainName": "justaverylongtestingname.chain",
            "commentCount": 0
          },
          {
            "amount": "100000000000000000",
            "claim_gen": 9,
            "sender": "ak_taR2fRi3cXYn7a7DaUNcU2KU41psa5JKmhyPC9QcER5T4efqp",
            "timestamp": 1588249316100,
            "title": "#other test",
            "url_id": 1,
            "id": 2,
            "url": "https://github.com/mradkov",
            "topics": [
              "#other"
            ],
            "retips": [],
            "claim": {
              "unclaimed": false,
              "claim_gen": 16,
              "unclaimed_amount": "100000000000000000"
            },
            "amount_ae": "0.1",
            "retip_amount_ae": "0",
            "total_amount": "0.1",
            "total_unclaimed_amount": "0",
            "total_claimed_amount": "0.1",
            "score": 0.0000978476453453386,
            "preview": null,
            "commentCount": 0
          },
        ];
      });

      const resTest = await chai.request(server).get('/cache/tips?search=test')
      resTest.should.have.status(200);
      resTest.body.should.be.a('array');
      resTest.body.should.have.length(2);
      stub.called.should.be.true;

      const resGithub = await chai.request(server).get('/cache/tips?search=github.com')
      resGithub.should.have.status(200);
      resGithub.body.should.be.a('array');
      resGithub.body.should.have.length(2);
      stub.called.should.be.true;

      // only find topic with #
      const resTopic = await chai.request(server).get('/cache/tips?search=%23test')
      resTopic.should.have.status(200);
      resTopic.body.should.be.a('array');
      resTopic.body.should.have.length(1);
      resTopic.body[0].id.should.equal(1);
      stub.called.should.be.true;
      stub.restore();
    }).timeout(10000);

    it('it should GET all cache items in less than 200ms', function (done) {
      this.timeout(200);
      checkCachedRoute('/cache/tips', 'array', done);
    });

    it('it should GET all oracle cache items', function (done) {
      this.timeout(10000);
      checkCachedRoute('/cache/oracle', 'object', done);
    });

    it(`it should GET all oracle cache items in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/oracle', 'object', done);
    });

    it(`it should GET a single tip cache item in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/tip?id=1', 'object', done);
    });

    it(`it should GET all user stats for a single user in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/userStats?address=ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk', 'object', done);
    });

    it(`it should GET all cached stats in less than 1000ms`, function (done) {
      this.timeout(1000);
      checkCachedRoute('/cache/stats', 'object', done);
    });

    it(`it should GET all chainnames cache items in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/chainnames', 'object', done);
    });

    it('it should GET the cached price', function (done) {
      checkCachedRoute('/cache/price', 'object', done);
    });

    it(`it should GET the cached price in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/price', 'object', done);
    });

    it(`it should GET all cached topics in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/topics', 'array', done);
    });

    it.skip(`it should GET all cached events`, function (done) {
      checkCachedRoute('/cache/events', 'array', done);
    });

    it.skip(`it should GET all cached events in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/events', 'array', done);
    });

    it('it should invalidate the tips cache', function (done) {
      checkCachedRoute('/cache/invalidate/tips', 'object', done);
    });

    it('it should invalidate the oracle cache', function (done) {
      checkCachedRoute('/cache/invalidate/oracle', 'object', done);
    });

    it('it should invalidate the events cache', function (done) {
      checkCachedRoute('/cache/invalidate/events', 'object', done);
    });
  });
})
;
