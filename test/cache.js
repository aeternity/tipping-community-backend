//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
const cache = require('../utils/cache');
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
      this.timeout(5000);
      checkCachedRoute('/cache/tips', 'array', done);
    });

    it('it should GET all cache items in less than 200ms', function (done) {
      this.timeout(200);
      checkCachedRoute('/cache/tips', 'array', done);
    });

    it('it should GET all oracle cache items', function (done) {
      this.timeout(2000);
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

    it(`it should GET all cached stats in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
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

    it('it should invalidate the tips cache', function (done) {
      checkCachedRoute('/cache/invalidate/tips', 'object', done);
    });

    it('it should invalidate the oracle cache', function (done) {
      checkCachedRoute('/cache/invalidate/oracle', 'object', done);
    });
  });
})
;
