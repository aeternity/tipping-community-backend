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

const { LinkPreview } = require('../utils/database.js');

chai.use(chaiHttp);
//Our parent block
describe('Language', () => {
  before(async () => { //Before each test we empty the database
    await LinkPreview.destroy({
      where: {},
      truncate: true,
    });
    await LinkPreview.create({
      requestUrl: 'en',
      lang: 'en',
      querySucceeded: true
    });
    await LinkPreview.create({
      requestUrl: 'zh',
      lang: 'zh',
      querySucceeded: true
    });
  });

  describe('Language API', () => {
    it('it should GET all the chinese entries', (done) => {
      chai.request(server).get('/language/zh').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.should.have.length(1);
        const firstResult = res.body[0];
        firstResult.should.have.property('requestUrl', 'zh');
        done();
      });
    });

    it('it should GET all the english entries', (done) => {
      chai.request(server).get('/language/en').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.should.have.length(1);
        const firstResult = res.body[0];
        firstResult.should.have.property('requestUrl', 'en');
        done();
      });
    });
  });

});
