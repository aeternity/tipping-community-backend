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
describe('LinkPreview', () => {
  before((done) => { //Before each test we empty the database
    LinkPreview.destroy({
      where: {},
      truncate: true,
    }).then(() => done());
  });

  const requestUrl = 'https://aeternity.com';

  describe('LinkPreview API', () => {
    it('it should GET all the linkpreview entries (empty)', (done) => {
      chai.request(server).get('/linkpreview/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    });

    it('it should CREATE a new linkpreview entry via linkpreview.net', function (done) {
      this.timeout(10000);
      chai.request(server).get('/linkpreview?url=' + encodeURIComponent(requestUrl)).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.should.have.property('requestUrl', requestUrl);
        res.body.should.have.property('title');
        res.body.should.have.property('description');
        res.body.should.have.property('image');
        res.body.should.have.property('responseUrl', requestUrl);
        res.body.should.have.property('querySucceeded', true);
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        done();
      });
    });

    it.skip('it should CREATE a new linkpreview entry via custom crawler', (done) => {
      chai.request(server).post('/linkpreview/force').auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD).send({
        url: requestUrl,
        custom: true,
      }).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.should.have.property('requestUrl', requestUrl);
        res.body.should.have.property('title');
        res.body.should.have.property('description');
        res.body.should.have.property('image');
        res.body.should.have.property('responseUrl', requestUrl);
        res.body.should.have.property('querySucceeded', true);
        res.body.should.have.property('failReason', null);
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        done();
      });
    });

    it('it should GET a single item', (done) => {
      chai.request(server).get(`/linkpreview?url=` + encodeURIComponent(requestUrl)).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('requestUrl', requestUrl);
        done();
      });
    });
  });

});
