//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
const { BlacklistEntry } = require('../models');

chai.use(chaiHttp);
//Our parent block
describe('Static Routes', () => {
  describe('Contract', () => {
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
  describe('Stats', () => {

    before(async function () {
      // Test is based on Blacklist model
      await BlacklistEntry.destroy({
        where: {},
        truncate: true,
      });
      await BlacklistEntry.create({
        tipId: 1,
        createdAt: new Date().setHours(0, 0, 0, 1),
      });
      await BlacklistEntry.create({
        tipId: 1,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 1),
      });
      await BlacklistEntry.create({
        tipId: 1,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 6)).setHours(0, 0, 0, 1),
      });
      await BlacklistEntry.create({
        tipId: 1,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 20)).setHours(0, 0, 0, 1),
      });
      await BlacklistEntry.create({
        tipId: 1,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 29)).setHours(0, 0, 0, 1),
      });
    });

    it('it should GET the correct stats', (done) => {
      chai.request(server).get('/static/stats').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('comments').to.be.an('object');
        res.body.should.have.property('linkPreviews').to.be.an('object');
        res.body.should.have.property('profiles').to.be.an('object');
        res.body.should.have.property('blacklist').to.be.an('object');
        res.body.blacklist.should.have.property('today', 1);
        res.body.blacklist.should.have.property('yesterday', 1);
        res.body.blacklist.should.have.property('last7Days', 3);
        res.body.blacklist.should.have.property('last30Days', 5);
        res.body.blacklist.should.have.property('total', 5);
        done();
      });
    });
  });
  describe('GrayList', () => {
    it('it should GET the hardcoded graylist', (done) => {
      chai.request(server).get('/static/wallet/graylist').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.includes('facebook.com').should.be.true;
        done();
      });
    });
  });
});
