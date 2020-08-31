// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, before } = require('mocha');
const sinon = require('sinon');

const server = require('../server');
const cache = require('../utils/cache');
const CacheLogic = require('../logic/cacheLogic.js');
const BlacklistLogic = require('../logic/blacklistLogic.js');
const ae = require('../utils/aeternity');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Cache', () => {
  before(async function () {
    this.timeout(20000);
    await cache.del(['getTips']);
    await cache.del(['fetchPrice']);
    await cache.del(['getChainNames']);
    await cache.del(['fetchStats']);
    await cache.del(['oracleState']);
    await ae.init();
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
      this.timeout(5000);
      checkCachedRoute('/cache/tips', 'array', done);
    });

    it('it should GET all cache items with filters', async () => {
      const stub = sinon.stub(CacheLogic, 'getAllTips').callsFake(() => [
        {
          sender: 'ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag',
          title: '#test tip',
          id: 1,
          url: 'https://github.com/thepiwo',
          topics: [
            '#test',
          ],
          preview: {
            title: 'thepiwo - Overview',
            description: 'Blockchain Engineer / Full-Stack Developer justaverylongtestingname.chain - thepiwo',
          },
          chainName: 'justaverylongtestingname.chain',
        },
        {
          sender: 'ak_taR2fRi3cXYn7a7DaUNcU2KU41psa5JKmhyPC9QcER5T4efqp',
          title: '#other test',
          id: 2,
          url: 'https://github.com/mradkov',
          topics: [
            '#other',
          ],
        },
      ]);

      const resTest = await chai.request(server).get('/cache/tips?search=test');
      resTest.should.have.status(200);
      resTest.body.should.be.a('array');
      resTest.body.should.have.length(2);
      stub.callCount.should.eql(1);

      const resGithub = await chai.request(server).get('/cache/tips?search=github.com');
      resGithub.should.have.status(200);
      resGithub.body.should.be.a('array');
      resGithub.body.should.have.length(2);
      stub.callCount.should.eql(2);

      // only find topic with #
      const resTopic = await chai.request(server).get('/cache/tips?search=%23test');
      resTopic.should.have.status(200);
      resTopic.body.should.be.a('array');
      resTopic.body.should.have.length(1);
      resTopic.body[0].id.should.equal(1);
      stub.callCount.should.eql(3);

      stub.restore();
    });

    it('it should GET all cache items with language filters', async () => {
      const stub = sinon.stub(CacheLogic, 'getAllTips').callsFake(() => [
        {
          id: 1,
          contentLanguage: 'en',
          preview: {
            lang: 'en',
          },
        },
        {
          id: 2,
          contentLanguage: null,
          preview: {
            lang: 'en',
          },
        },
        {
          id: 3,
          contentLanguage: 'zh',
          preview: {
            lang: 'en',
          },
        },
        {
          id: 4,
          contentLanguage: 'zh',
          preview: {
            lang: 'zh',
          },
        },
      ]);

      // filter by english lang
      const resLanguageEN = await chai.request(server).get('/cache/tips?language=en');
      resLanguageEN.should.have.status(200);
      resLanguageEN.body.should.be.a('array');
      resLanguageEN.body.should.have.length(2);
      resLanguageEN.body[0].id.should.equal(1);
      stub.callCount.should.eql(1);

      // filter by chinese lang
      const resLanguageZH = await chai.request(server).get('/cache/tips?language=zh');
      resLanguageZH.should.have.status(200);
      resLanguageZH.body.should.be.a('array');
      resLanguageZH.body.should.have.length(1);
      resLanguageZH.body[0].id.should.equal(4);
      stub.callCount.should.eql(2);

      // filter by chinese lang
      const resLanguageZHEN = await chai.request(server).get('/cache/tips?language=zh|en');
      resLanguageZHEN.should.have.status(200);
      resLanguageZHEN.body.should.be.a('array');
      resLanguageZHEN.body.should.have.length(4);
      resLanguageZHEN.body[0].id.should.equal(1);
      stub.callCount.should.eql(3);

      stub.restore();
    });

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
      checkCachedRoute('/cache/tip?id=0', 'object', done);
    });

    it('it should 404 on a non existing tip', done => {
      chai.request(server).get('/cache/tip?id=15687651684785').end((err, res) => {
        res.should.have.status(404);
        done();
      });
    });

    it('it should GET a flagged / blacklisted tip', done => {
      const stub = sinon.stub(BlacklistLogic, 'getBlacklistedIds').callsFake(() => [0]);
      chai.request(server).get('/cache/tips').end((err, res) => {
        res.should.have.status(200);
        stub.callCount.should.eql(1);
        stub.restore();
        done();
      });
    });

    it('it should not GET a flagged / blacklisted tip when requesting the full list', done => {
      const stub = sinon.stub(BlacklistLogic, 'getBlacklistedIds').callsFake(() => [0]);
      chai.request(server).get('/cache/tips').end((err, res) => {
        res.should.have.status(200);
        const tipIds = res.body.map(({ id }) => id);
        tipIds.should.not.contain(0);
        stub.callCount.should.eql(1);
        stub.restore();
        done();
      });
    });

    it('it should GET a flagged / blacklisted tip when requesting the full list explicitly', done => {
      const stub = sinon.stub(BlacklistLogic, 'getBlacklistedIds').callsFake(() => [1]);
      chai.request(server).get('/cache/tips?blacklist=false').end((err, res) => {
        res.should.have.status(200);
        const tipIds = res.body.map(tip => tip.id);
        tipIds.should.contain('0');
        stub.callCount.should.eql(1);
        stub.restore();
        done();
      });
    });

    it(`it should GET all user stats for a single user in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/userStats?address=ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk', 'object', done);
    });

    it('it should GET all cached stats in less than 1000ms', function (done) {
      this.timeout(1000);
      checkCachedRoute('/cache/stats', 'object', done);
    });

    it(`it should GET all cached stats in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/stats', 'object', done);
    });

    it(`it should GET all chainnames cache items in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/chainnames', 'object', done);
    });

    it('it should GET the cached price', done => {
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

    it('it should GET all cached events', function (done) {
      this.timeout(25000);
      checkCachedRoute('/cache/events', 'array', done);
    });

    it(`it should GET all cached events in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/events', 'array', done);
    });

    it('it should invalidate the tips cache', done => {
      checkCachedRoute('/cache/invalidate/tips', 'object', done);
    });

    it('it should invalidate the oracle cache', done => {
      checkCachedRoute('/cache/invalidate/oracle', 'object', done);
    });

    it('it should invalidate the events cache', done => {
      checkCachedRoute('/cache/invalidate/events', 'object', done);
    });
  });
});
