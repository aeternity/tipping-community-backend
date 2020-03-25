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

      chai.request(server).get('/cache/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
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

    it('it should invalidate the tips cache', function (done) {
      this.timeout(25000);

      chai.request(server).get('/cache/invalidate/tips').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });
  });
  describe('Interface', () => {
    it('it should return ok on status interface', function(done) {
      this.timeout(25000);

      chai.request(server).get('/cache/status')
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .end((err, res) => {
        res.should.have.status(200);
        done();
      });
    });
  });
});
