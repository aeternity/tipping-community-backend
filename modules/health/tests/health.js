// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');
const sinon = require('sinon');
const server = require('../../../server');
const aeternity = require('../../aeternity/logic/aeternity');

chai.should();
chai.use(chaiHttp);

describe('Health Endpoint', () => {
  describe('Backend Health', () => {
    afterEach(() => {
      sinon.restore();
    });
    it('it should GET a health endpoint answer', done => {
      sinon.stub(aeternity, 'getBalance').resolves('10');
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
