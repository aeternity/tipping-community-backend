// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { describe, it } = require('mocha');

const server = require('../server');
const ae = require('../utils/aeternity.js');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Verified', () => {
  describe('Verified API', () => {
    it('it should GET all the verified entries', done => {
      const stub = sinon.stub(ae, 'getTips').callsFake(() => [
        {
          url: 'https://www.test.domain.com',
          claim: {
            unclaimed: false,
          },
        },
      ]);
      chai.request(server).get('/verified/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.should.have.length(1);
        res.body[0].should.equal('https://www.test.domain.com');
        stub.called.should.equal(true);
        stub.restore();
        done();
      });
    });
  });
});
