//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);
//Our parent block
describe('Static Routes', () => {
  describe('Contract API', () => {
    it('it should GET the contract file and the contract address', (done) => {
      chai.request(server).get('/static/contract').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('contractFile', process.env.CONTRACT_FILE);
        res.body.should.have.property('contractAddress', process.env.CONTRACT_ADDRESS);
        done();
      });
    });
  });
});
