//During the test the env variable is set to test
process.env = {
  ...process.env,
  NODE_URL: 'https://mainnet.aeternal.io',
  COMPILER_URL: 'https://compiler.aepps.com',
  CONTRACT_ADDRESS: 'ct_YpQpntd6fi6r3VXnGW7vJiwPYtiKvutUDY35L4PiqkbKEVRqj',
  AUTHENTICATION_USER: 'admin',
  AUTHENTICATION_PASSWORD: 'pass',
  CONTRACT_FILE: 'TippingCorona'
};

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();


chai.use(chaiHttp);
//Our parent block
describe('Verified', () => {
  describe('Verified API', () => {
    it('it should GET all the verified entries', (done) => {
      chai.request(server).get('/verified/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    }).timeout(10000);
    it('it should GET all the verified entries quickly the second time', (done) => {
      chai.request(server).get('/verified/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    }).timeout(10000);
  });
});
