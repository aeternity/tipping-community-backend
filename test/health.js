//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);
//Our parent block
describe('Health Endpoint', () => {

  describe('Backend Health', () => {
    it('it should GET a health endpoint answer', (done) => {
      chai.request(server).get('/health/backend').end((err, res) => {
        console.log(res.body)
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('dbHealth', true);
        res.body.should.have.property('ipfsHealth', true);
        res.body.should.have.property('redisHealth', true);
        res.body.should.have.property('aeHealth', true);
        res.body.should.have.property('allHealthy', true);
        done();
      });
    });
  });
});
