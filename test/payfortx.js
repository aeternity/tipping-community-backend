//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
let should = chai.should();

// Imports to load data
const server = require('../server.js');

chai.use(chaiHttp);
//Our parent block
describe('Pay for TX', () => {

  describe('Flat API Tests', () => {
    it('it should fail without body', (done) => {
      chai.request(server).post('/claim/submit').send({}).end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });

    it('it should fail without address', (done) => {
      chai.request(server).post('/claim/submit').send({
        url: 'https://aeternity.com',
      }).end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });

    it('it should fail without url', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: publicKey,
      }).end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });
  });

  describe('valid request', () => {

    before(async function () {
      this.timeout(25000);
      const ae = require('../utils/aeternity.js');
      await ae.init();
    });

    it('it should reject on website not in contract', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: publicKey,
        url: 'https://complicated.domain.test',
      }).end((err, res) => {
        res.should.have.status(500);
        res.body.should.have.property('error', 'No zero amount claims');
        done();
      });
    }).timeout(10000);

  });

  describe('Logger tests', () => {
    it('should return json parsable logs on endpoint', (done) => {
      chai.request(server).get('/logs/all')
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });
  });

});
