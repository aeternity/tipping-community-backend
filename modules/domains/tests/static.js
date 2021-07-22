// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');
const server = require('../../../server');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Static Routes', () => {
  describe('GrayList', () => {
    it('it should GET the hardcoded graylist', done => {
      chai.request(server).get('/static/wallet/graylist').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.includes('facebook.com').should.equal(true);
        done();
      });
    });
  });
});
