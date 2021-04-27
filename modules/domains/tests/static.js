// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, before } = require('mocha');
const server = require('../../../server');
const { BlacklistEntry, Tip } = require('../../../models');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Static Routes', () => {
  describe('Stats', () => {
    before(async () => {
      // Test is based on Blacklist model
      let id = 1;
      await Tip.truncate({
        cascade: true,
      });
      await Tip.bulkCreate(Array(5).fill(0).map(() => ({
        id: `${id++}_v1`,
        title: 'some',
        type: 'AE_TIP',
        contractId: 'ct_test',
        timestamp: 0,
        topics: [],
      })));

      await BlacklistEntry.truncate();
      await BlacklistEntry.create({
        tipId: '1_v1',
        createdAt: new Date().setHours(0, 0, 0, 1),
      });
      await BlacklistEntry.create({
        tipId: '2_v1',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 1),
      });
      await BlacklistEntry.create({
        tipId: '3_v1',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 6)).setHours(0, 0, 0, 1),
      });
      await BlacklistEntry.create({
        tipId: '4_v1',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 20)).setHours(0, 0, 0, 1),
      });
      await BlacklistEntry.create({
        tipId: '5_v1',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 29)).setHours(0, 0, 0, 1),
      });
    });

    it('it should GET the correct stats', done => {
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
    it('it should GET the correct stats in under 200ms', function (done) {
      this.timeout(200);
      chai.request(server).get('/static/stats').end((err, res) => {
        res.should.have.status(200);
        done();
      });
    });
  });
  describe('GrayList', () => {
    it('it should GET the hardcoded graylist', done => {
      chai.request(server).get('/static/wallet/graylist').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.includes('facebook.com').should.equal(true);
        done();
      });
    });
  });
});
