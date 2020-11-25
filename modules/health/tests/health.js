// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');
const server = require('../../../server');

chai.should();
chai.use(chaiHttp);

describe('Health Endpoint', () => {
  describe('Backend Health', () => {
    it('it should GET a health endpoint answer', done => {
      chai.request(server).get('/health/backend').end((err, res) => {
        res.body.should.be.a('object');
        res.body.should.have.property('dbHealth', true);
        res.body.should.have.property('ipfsHealth', true);
        res.body.should.have.property('redisHealth', true);
        res.body.should.have.property('aeHealth', true);
        res.body.should.have.property('allHealthy', true);
        res.should.have.status(200);
        done();
      });
    });
  });
});
