// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const { describe, it, before } = require('mocha');
const sinon = require('sinon');
const BigNumber = require('bignumber.js');
const server = require('../../../server');
const ae = require('../../aeternity/logic/aeternity');
const cache = require('../../cache/utils/cache');
const { Trace: TraceModel } = require('../../../models');
const { publicKey } = require('../../../utils/testingUtil');
const CacheLogic = require('../../cache/logic/cacheLogic');
const EventLogic = require('../../event/logic/eventLogic');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Trace', () => {
  before(async function () { // Before each test we empty the database
    this.timeout(10000);
    await TraceModel.destroy({
      where: {},
      truncate: true,
    });

    await ae.init();
    await cache.init(ae);
  });

  describe('TraceLogic API Backend', () => {
    it('it should GET all traces for tipID 0', done => {
      const stub = sinon.stub(CacheLogic, 'getTips').callsFake(async () => [{
        id: '0',
        url: 'https://aeternity.com',
      }]);
      chai.request(server).get('/tracing/backend?id=0').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(0);
        stub.restore();
        done();
      });
    });

    it('malformed request without url should not leave a trace', done => {
      chai.request(server).post('/claim/submit')
        .send({
          address: 'ak_25tyimcbt8W5BHauzazQKnb6oM1AbkPBYFu6fnSvp38kVrtr8t', // RANDOM PK
        })
        .end((err, res) => {
          res.should.have.status(400);
          TraceModel.findAll({ raw: true }).then(results => {
            results.should.have.length(0);
            done();
          });
        });
    });

    it('malformed request with claimamount 0 should not leave a trace', function (done) {
      this.timeout(10000);
      chai.request(server).post('/claim/submit')
        .send({
          address: publicKey, // Random PK
          url: 'https://this.is.a.fake.url', // Random URL
        })
        .end((err, res) => {
          res.should.have.status(400);
          TraceModel.findAll({ raw: true }).then(results => {
            results.should.have.length(0);
            done();
          });
        });
    });

    it('proper request should leave a trace', done => {
      const stub = sinon.stub(ae, 'getTotalClaimableAmount').callsFake(async () => new BigNumber(10));
      chai.request(server).post('/claim/submit')
        .send({
          address: publicKey, // Random PK
          url: 'example.com',
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('claimUUID');
          fs.existsSync(`./traces/${res.body.claimUUID}.json`).should.equal(true);
          stub.restore();
          done();
        });
    });

    it('it should GET all traces for a proper tip', function (done) {
      this.timeout(20000);
      chai.request(server).get('/tracing/backend?id=462_v1').end((err, res) => { // 462_v1 == example.com
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(1);
        done();
      });
    });

    it('it should GET all blockchain traces for a proper tip', function (done) {
      this.timeout(20000);
      const stub = sinon.stub(EventLogic, 'getEventsForURL').callsFake(async () => ([{
        event: 'TipReceived',
        url: 'example.com',
      },
      {
        event: 'TipReceived',
        url: 'example.com',
      }]));

      const oracleStub = sinon.stub(ae, 'fetchOracleClaimByUrl').callsFake(async () => null);

      const cacheStub = sinon.stub(CacheLogic, 'getTips').callsFake(async () => ([{
        amount: '200000000000000000',
        claim_gen: 1,
        sender: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5',
        timestamp: 1606211552360,
        title: '#test',
        url_id: 1,
        type: 'amount',
        id: '462_v1',
        contractId: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd',
        url: 'example.com',
        retips: [],
        claim: {
          unclaimed: true,
          claim_gen: 0,
          unclaimed_amount: '233301213346200000000',
          token_unclaimed_amount: [],
        },
        token: null,
        token_amount: 0,
        total_amount: '200000000000000000',
        token_total_amount: [],
        total_unclaimed_amount: '200000000000000000',
        total_claimed_amount: '0',
        token_total_unclaimed_amount: [],
        topics: ['#test'],
        amount_ae: '0.2',
        total_amount_ae: '0.2',
        total_unclaimed_amount_ae: '0.2',
        total_claimed_amount_ae: '0',
      }]));

      chai.request(server).get('/tracing/blockchain?id=462_v1').end((err, res) => { // 462_v1 == example.com
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.deep.equal({
          tip: {
            amount: '200000000000000000',
            claim_gen: 1,
            sender: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5',
            timestamp: 1606211552360,
            title: '#test',
            url_id: 1,
            type: 'amount',
            id: '462_v1',
            contractId: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd',
            url: 'example.com',
            retips: [],
            claim: {
              unclaimed: true,
              claim_gen: 0,
              unclaimed_amount: '233301213346200000000',
              token_unclaimed_amount: [],
            },
            token: null,
            token_amount: 0,
            total_amount: '200000000000000000',
            token_total_amount: [],
            total_unclaimed_amount: '200000000000000000',
            total_claimed_amount: '0',
            token_total_unclaimed_amount: [],
            topics: ['#test'],
            amount_ae: '0.2',
            total_amount_ae: '0.2',
            total_unclaimed_amount_ae: '0.2',
            total_claimed_amount_ae: '0',
          },
          url_stats: {
            tips_length: 1,
            retips_length: 0,
            total_tips_length: 1,
            total_amount: '200000000000000000',
            total_unclaimed_amount: '200000000000000000',
            total_claimed_amount: '0',
            total_amount_ae: '0.2',
            total_unclaimed_amount_ae: '0.2',
            total_claimed_amount_ae: '0',
            token_total_amount: [],
            token_total_unclaimed_amount: [],
            senders: ['ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5'],
            senders_length: 1,
          },
          url_tips: [
            {
              amount: '200000000000000000',
              claim_gen: 1,
              sender: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5',
              timestamp: 1606211552360,
              title: '#test',
              url_id: 1,
              type: 'amount',
              id: '462_v1',
              contractId: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd',
              url: 'example.com',
              retips: [],
              claim: {
                claim_gen: 0,
                token_unclaimed_amount: [],
                unclaimed: true,
                unclaimed_amount: '233301213346200000000',
              },
              token: null,
              token_amount: 0,
              total_amount: '200000000000000000',
              token_total_amount: [],
              total_unclaimed_amount: '200000000000000000',
              total_claimed_amount: '0',
              token_total_unclaimed_amount: [],
              topics: ['#test'],
              amount_ae: '0.2',
              total_amount_ae: '0.2',
              total_unclaimed_amount_ae: '0.2',
              total_claimed_amount_ae: '0',
            },
          ],
          url_oracle_claim: null,
          url_events: [
            {
              event: 'TipReceived',
              url: 'example.com',
            },
            {
              event: 'TipReceived',
              url: 'example.com',
            },
          ],
          url_intermediate_oracle_answers: [],
        });
        stub.restore();
        cacheStub.restore();
        oracleStub.restore();
        done();
      });
    });
  });
});
