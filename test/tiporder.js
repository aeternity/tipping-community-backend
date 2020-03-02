//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);
//Our parent block
describe('Tiporder', () => {
  before(async function () {
    this.timeout(25000);
    const ae = require('../utils/aeternity.js');
    await ae.init();
  });

  describe('Tiporder API', () => {
    it('it should get a ordered list of all tips in the contract', (done) => {
      chai.request(server).get('/tiporder/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        if(res.body.length > 0) {
          res.body[0].should.have.property('score');
          res.body[0].should.have.property('id');
        }
        done();
      });
    }).timeout(10000);
  });
});
