let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');

chai.use(chaiHttp);

describe('Token Cache', () => {
  describe('API', () => {
    it('it should GET token info', function (done) {
      this.timeout(30000);

      chai.request(server).get('/tokenCache/tokenInfo').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('ct_2DQ1vdJdiaNVgh2vUbTTpkPRiT9e2GSx1NxyU7JM9avWqj6dVf');
        res.body['ct_2DQ1vdJdiaNVgh2vUbTTpkPRiT9e2GSx1NxyU7JM9avWqj6dVf'].should.be.deep.equal({
          "decimals": 18,
          "name": "Sample Test Token",
          "symbol": "STT"
        })
        done();
      });
    });

    it('it should ADD a token to be indexed', function (done) {
      chai.request(server).post('/tokenCache/addToken')
        .send({address: "ct_2DQ1vdJdiaNVgh2vUbTTpkPRiT9e2GSx1NxyU7JM9avWqj6dVf"}).end((err, res) => {
        res.should.have.status(200);
        res.text.should.be.equal('OK');
        done();
      });
    });

    it('it shouldnt GET token info without address', function (done) {
      chai.request(server).get('/tokenCache/balances').end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });

    it('it should GET token balances for address', function (done) {
      chai.request(server).get('/tokenCache/balances?address=' + process.env.PUBLIC_KEY).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });

  });
});
