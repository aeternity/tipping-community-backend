//During the test the env variable is set to test
process.env = {
  ...process.env,
  NODE_URL: 'https://mainnet.aeternal.io',
  COMPILER_URL: 'https://compiler.aepps.com',
  CONTRACT_ADDRESS: 'ct_YpQpntd6fi6r3VXnGW7vJiwPYtiKvutUDY35L4PiqkbKEVRqj',
  AUTHENTICATION_USER: 'admin',
  AUTHENTICATION_PASSWORD: 'pass',
  CONTRACT_FILE: 'TippingCorona',
};

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');

const { LinkPreview } = require('../utils/database.js');
const LinkPreviewLogic = require('../logic/linkPreviewLogic.js');

chai.use(chaiHttp);
//Our parent block
describe('LinkPreview', () => {

  const requestUrl = 'https://aeternity.com/';

  before(async () => { //Before each test we empty the database
    await LinkPreview.destroy({
      where: {},
      truncate: true,
    });
    await LinkPreviewLogic.generatePreview(requestUrl);
  });

  describe('LinkPreview API', () => {
    it('it should GET all the linkpreview entries (empty)', (done) => {
      chai.request(server).get('/linkpreview/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    });

    it('it get link preview for aeternity.com', (done) => {
      chai.request(server).get('/linkpreview?url=' + encodeURIComponent(requestUrl)).end((err, res) => {
        res.should.have.status(200);
        console.log(res.body);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.should.have.property('requestUrl', requestUrl);
        res.body.should.have.property('title');
        res.body.should.have.property('description');
        res.body.should.have.property('lang');
        res.body.should.have.property('image');
        res.body.should.have.property('querySucceeded', 1);
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        done();
      }).timeout(10000);
    });
  });
});
