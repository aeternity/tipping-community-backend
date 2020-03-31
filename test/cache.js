//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);
//Our parent block
describe('Cache', () => {
  describe('API', () => {
    it('it should GET all cache items', function (done) {
      this.timeout(25000);

      chai.request(server).get('/cache/tips').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    });

    it('it should GET all oracle cache items', function (done) {
      this.timeout(25000);

      chai.request(server).get('/cache/oracle').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET all tip cache items', function (done) {
      this.timeout(25000);

      chai.request(server).get('/cache/tip?id=1').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET all user stats cache items', function (done) {
      this.timeout(25000);

      chai.request(server).get('/cache/userStats?address=ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET all stats cache items', function (done) {
      this.timeout(25000);

      chai.request(server).get('/cache/stats').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET all chainnames cache items', function (done) {
      this.timeout(25000);

      chai.request(server).get('/cache/chainnames').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET all price cache items', function (done) {
      this.timeout(25000);

      chai.request(server).get('/cache/price').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

    it('it should GET all price cache items', function (done) {
      this.timeout(25000);

      chai.request(server).get('/cache/topics').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    });

    it('it should invalidate the tips cache', function (done) {
      this.timeout(25000);

      chai.request(server).get('/cache/invalidate/tips').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });
  });
});
