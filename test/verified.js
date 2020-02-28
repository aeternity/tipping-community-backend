//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);
//Our parent block
describe('Verified', () => {
  before(async function () {
    this.timeout(25000);
    const ae = require('../utils/aeternity.js');
    await ae.init();
  });

  describe('Verified API', () => {
    it('it should GET all the verified entries', (done) => {
      chai.request(server).get('/verified/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    }).timeout(10000);
  });
});
