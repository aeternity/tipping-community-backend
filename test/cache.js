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

  describe('API', () => {
    it('it should GET all cache items', function (done) {
      chai.request(server).get('/cache/tips').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    });

    it('it should GET all oracle cache items', function (done) {
      chai.request(server).get('/cache/oracle').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET a single tip cache item', function (done) {
      chai.request(server).get('/cache/tip?id=1').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET all user stats for a single user', function (done) {
      chai.request(server).get('/cache/userStats?address=ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET all cached stats', function (done) {
      chai.request(server).get('/cache/stats').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET all chainnames cache items', function (done) {
      chai.request(server).get('/cache/chainnames').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET the cached price', function (done) {
      chai.request(server).get('/cache/price').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET all cached topics', function (done) {
      chai.request(server).get('/cache/topics').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    });

    it('it should invalidate the tips cache', function (done) {
      chai.request(server).get('/cache/invalidate/tips').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });
  });
});
