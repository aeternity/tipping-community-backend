//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
const ae = require('../utils/aeternity.js');
const sinon = require('sinon');

chai.use(chaiHttp);
//Our parent block
describe('Verified', () => {
  describe('Verified API', () => {
    it('it should GET all the verified entries', (done) => {
      const stub = sinon.stub(ae, 'getTips').callsFake(function () {
        return [
          {
            url: 'https://www.test.domain.com',
            claim: {
              unclaimed: false,
            }
          },
        ];
      });
      chai.request(server).get('/verified/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.should.have.length(1);
        res.body[0].should.equal('https://www.test.domain.com');
        stub.called.should.be.true;
        stub.restore();
        done();
      });
    });
  });
});
