import chai from 'chai';
import chaiHttp from 'chai-http';
import mocha from 'mocha';
import server from '../../../server.js';
import models from '../../../models/index.js';

const { describe, it, before } = mocha;
const { BlacklistEntry, Tip, Profile } = models;
chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Stats Routes', () => {
  describe('Marketing', () => {
    before(async () => {
      // Test is based on Blacklist model
      let id = 1;
      await Profile.truncate({
        cascade: true,
      });
      await Tip.truncate({
        cascade: true,
      });
      await Tip.bulkCreate(Array(5).fill(0).map(() => ({
        id: `${id++}_v1`,
        title: 'some',
        type: 'AE_TIP',
        contractId: 'ct_test',
        sender: 'ak_test',
        timestamp: new Date().getTime(),
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
      chai.request(server).get('/stats/marketing').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('1day').to.be.an('object');
        res.body.should.have.property('7days').to.be.an('object');
        res.body.should.have.property('30days').to.be.an('object');
        res.body['1day'].should.have.property('tipsCount', '5');
        res.body['1day'].should.have.property('retipsCount', '0');
        res.body['1day'].should.have.property('uniqueTippers', '1');
        res.body['1day'].should.have.property('uniqueRetippers', '0');
        res.body['1day'].should.have.property('commentCount', '0');
        res.body['1day'].should.have.property('uniqueCommentors', '0');
        res.body['1day'].should.have.property('profileCount', '0');
        res.body['1day'].should.have.property('blacklistCount', '1');
        res.body['1day'].should.have.property('tipAmount', '0');
        res.body['1day'].should.have.property('retipAmount', '0');
        res.body['1day'].should.have.property('tipTokenAmount').to.be.an('array');
        res.body['1day'].should.have.property('retipTokenAmount').to.be.an('array');
        res.body['7days'].should.have.property('tipsCount', '5');
        res.body['7days'].should.have.property('retipsCount', '0');
        res.body['7days'].should.have.property('uniqueTippers', '1');
        res.body['7days'].should.have.property('uniqueRetippers', '0');
        res.body['7days'].should.have.property('commentCount', '0');
        res.body['7days'].should.have.property('uniqueCommentors', '0');
        res.body['7days'].should.have.property('profileCount', '0');
        res.body['7days'].should.have.property('blacklistCount', '3');
        res.body['7days'].should.have.property('tipAmount', '0');
        res.body['7days'].should.have.property('retipAmount', '0');
        res.body['7days'].should.have.property('tipTokenAmount').to.be.an('array');
        res.body['7days'].should.have.property('retipTokenAmount').to.be.an('array');
        res.body['30days'].should.have.property('tipsCount', '5');
        res.body['30days'].should.have.property('retipsCount', '0');
        res.body['30days'].should.have.property('uniqueTippers', '1');
        res.body['30days'].should.have.property('uniqueRetippers', '0');
        res.body['30days'].should.have.property('commentCount', '0');
        res.body['30days'].should.have.property('uniqueCommentors', '0');
        res.body['30days'].should.have.property('profileCount', '0');
        res.body['30days'].should.have.property('blacklistCount', '5');
        res.body['30days'].should.have.property('tipAmount', '0');
        res.body['30days'].should.have.property('retipAmount', '0');
        res.body['30days'].should.have.property('tipTokenAmount').to.be.an('array');
        res.body['30days'].should.have.property('retipTokenAmount').to.be.an('array');
        done();
      });
    });
    it('it should GET the correct stats in under 200ms', function (done) {
      this.timeout(200);
      chai.request(server).get('/stats/marketing').end((err, res) => {
        res.should.have.status(200);
        done();
      });
    });
  });
});
