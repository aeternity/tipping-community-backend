// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, before } = require('mocha');
const sinon = require('sinon');

const server = require('../../../server');
const cache = require('../utils/cache');
const CacheLogic = require('../logic/cacheLogic');
const BlacklistLogic = require('../../blacklist/logic/blacklistLogic');
const MdwLogic = require('../../aeternity/logic/mdwLogic');
const aeternity = require('../../aeternity/logic/aeternity');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Cache', () => {
  before(async function () {
    this.timeout(20000);
    await cache.del(['getTips']);
    await cache.del(['fetchPrice']);
    await cache.del(['getChainNames']);
    await cache.del(['fetchStats']);
    await cache.del(['oracleState']);
    await cache.del(['contractEvents']);

    await aeternity.init();
  });

  const checkCachedRoute = (route, type, done) => {
    chai.request(server).get(route).end((err, res) => {
      res.should.have.status(200);
      res.body.should.be.a(type);
      done();
    });
  };
  const minimalTimeout = 200;

  describe('API', () => {
    it('it should GET all cache items', function (done) {
      this.timeout(5000);
      checkCachedRoute('/cache/tips', 'array', done);
    });

    it('it should GET all cache items with filters', async () => {
      const stub = sinon.stub(CacheLogic, 'getAllTips').callsFake(() => [
        {
          sender: 'ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag',
          title: '#test tip',
          id: 1,
          url: 'https://github.com/thepiwo',
          topics: [
            '#test',
          ],
          preview: {
            title: 'thepiwo - Overview',
            description: 'Blockchain Engineer / Full-Stack Developer justaverylongtestingname.chain - thepiwo',
          },
          chainName: 'justaverylongtestingname.chain',
        },
        {
          sender: 'ak_taR2fRi3cXYn7a7DaUNcU2KU41psa5JKmhyPC9QcER5T4efqp',
          title: '#other test',
          id: 2,
          url: 'https://github.com/mradkov',
          topics: [
            '#other',
          ],
        },
      ]);

      const resTest = await chai.request(server).get('/cache/tips?search=test');
      resTest.should.have.status(200);
      resTest.body.should.be.a('array');
      resTest.body.should.have.length(2);
      stub.callCount.should.eql(1);

      const resGithub = await chai.request(server).get('/cache/tips?search=github.com');
      resGithub.should.have.status(200);
      resGithub.body.should.be.a('array');
      resGithub.body.should.have.length(2);
      stub.callCount.should.eql(2);

      // only find topic with #
      const resTopic = await chai.request(server).get('/cache/tips?search=%23test');
      resTopic.should.have.status(200);
      resTopic.body.should.be.a('array');
      resTopic.body.should.have.length(1);
      resTopic.body[0].id.should.equal(1);
      stub.callCount.should.eql(3);

      stub.restore();
    });

    it('it should GET all cache items with language filters', async () => {
      const stub = sinon.stub(CacheLogic, 'getAllTips').callsFake(() => [
        {
          id: '1_v1',
          contentLanguage: 'en',
          preview: {
            lang: 'en',
          },
        },
        {
          id: '2_v1',
          contentLanguage: null,
          preview: {
            lang: 'en',
          },
        },
        {
          id: '3_v1',
          contentLanguage: 'zh',
          preview: {
            lang: 'en',
          },
        },
        {
          id: '4_v1',
          contentLanguage: 'zh',
          preview: {
            lang: 'zh',
          },
        },
      ]);

      // filter by english lang
      const resLanguageEN = await chai.request(server).get('/cache/tips?language=en');
      resLanguageEN.should.have.status(200);
      resLanguageEN.body.should.be.a('array');
      resLanguageEN.body.should.have.length(2);
      resLanguageEN.body[0].id.should.equal('1_v1');
      stub.callCount.should.eql(1);

      // filter by chinese lang
      const resLanguageZH = await chai.request(server).get('/cache/tips?language=zh');
      resLanguageZH.should.have.status(200);
      resLanguageZH.body.should.be.a('array');
      resLanguageZH.body.should.have.length(1);
      resLanguageZH.body[0].id.should.equal('4_v1');
      stub.callCount.should.eql(2);

      // filter by chinese lang
      const resLanguageZHEN = await chai.request(server).get('/cache/tips?language=zh|en');
      resLanguageZHEN.should.have.status(200);
      resLanguageZHEN.body.should.be.a('array');
      resLanguageZHEN.body.should.have.length(4);
      resLanguageZHEN.body[0].id.should.equal('1_v1');
      stub.callCount.should.eql(3);

      stub.restore();
    });

    it('it should GET all cache items with contractVersion filters', async () => {
      const stub = sinon.stub(CacheLogic, 'getAllTips').callsFake(() => [
        {
          id: '1_v1',
        },
        {
          id: '2_v1',
        },
        {
          id: '3_v2',
        },
        {
          id: '4_v3',
        },
      ]);

      // filter by v1
      const resV1 = await chai.request(server).get('/cache/tips?contractVersion=v1');
      resV1.should.have.status(200);
      resV1.body.should.be.a('array');
      resV1.body.should.have.length(2);
      resV1.body[0].id.should.equal('1_v1');
      stub.callCount.should.eql(1);

      // filter by v2
      const resV2 = await chai.request(server).get('/cache/tips?contractVersion=v2');
      resV2.should.have.status(200);
      resV2.body.should.be.a('array');
      resV2.body.should.have.length(1);
      resV2.body[0].id.should.equal('3_v2');
      stub.callCount.should.eql(2);

      // filter by v2 + v3
      const resV2V3 = await chai.request(server).get('/cache/tips?contractVersion=v2&contractVersion=v3');
      resV2V3.should.have.status(200);
      resV2V3.body.should.be.a('array');
      resV2V3.body.should.have.length(2);
      resV2V3.body[0].id.should.equal('3_v2');
      stub.callCount.should.eql(3);

      stub.restore();
    });

    it('it should not GET a flagged / blacklisted tip when requesting the full list', done => {
      const stub = sinon.stub(BlacklistLogic, 'getBlacklistedIds').callsFake(() => ['0_v1']);
      cache.del(['CacheLogic.getAllTips', 'blacklisted']);
      chai.request(server).get('/cache/tips').end((err, res) => {
        res.should.have.status(200);
        const tipIds = res.body.map(({ id }) => id);
        tipIds.should.not.contain('0_v1');
        stub.callCount.should.eql(1);
        stub.restore();
        done();
      });
    });

    it('it should GET a flagged / blacklisted tip when requesting the full list explicitly', done => {
      const stub = sinon.stub(BlacklistLogic, 'getBlacklistedIds').callsFake(() => ['0_v1']);
      cache.del(['CacheLogic.getAllTips', 'all']);
      chai.request(server).get('/cache/tips?blacklist=false').end((err, res) => {
        res.should.have.status(200);
        const tipIds = res.body.map(tip => tip.id);
        tipIds.should.contain('0_v1');
        stub.callCount.should.eql(1);
        stub.restore();
        done();
      });
    });

    it(`it should GET all cache items in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/tips', 'array', done);
    });

    it('it should GET all oracle cache items', function (done) {
      this.timeout(10000);
      checkCachedRoute('/cache/oracle', 'object', done);
    });

    it(`it should GET all oracle cache items in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/oracle', 'object', done);
    });

    it(`it should GET a single V1 tip cache item in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/tip?id=0_v1', 'object', done);
    });

    it(`it should GET a single V2 tip cache item in less than ${minimalTimeout}ms`, function (done) {
      if (!aeternity.contractV2) this.skip();
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/tip?id=0_v2', 'object', done);
    });

    it('it should 404 on a non existing tip', done => {
      chai.request(server).get('/cache/tip?id=15687651684785').end((err, res) => {
        res.should.have.status(404);
        done();
      });
    });

    it(`it should GET all user stats for a single user in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/userStats?address=ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk', 'object', done);
    });

    it(`it should GET all chainnames cache items in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/chainnames', 'object', done);
    });

    it('it should GET the cached price', function (done) {
      this.timeout(10000);
      checkCachedRoute('/cache/price', 'object', done);
    });

    it(`it should GET the cached price in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/price', 'object', done);
    });

    it(`it should GET all cached topics in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/topics', 'array', done);
    });

    it('it should GET all cached events', done => {
      const mockData = [
        {
          block_hash: 'mh_2fq2n5muPiZSPuvyQu3YK79zdnYMd6b4Hi2oTk7VuNVJjh5jDH',
          block_height: 325384,
          hash: 'th_mrVytfYRrcse1RP7zNX9eSciczCQtqmZXzxzuNdm4TXEZh7oD',
          micro_index: 0,
          micro_time: 1602082686948,
          signatures: [
            'sg_Ur673FGUiHoBFza9EuvoJgXXDr9NwhEUzhZoqjwufwyC24jTWoSzTiRzHgpYpCVwsabhjMngFKYgPfrA6rF1AYMmViDU',
          ],
          tx: {
            abi_version: 3,
            amount: 100000000000000000,
            arguments: [
              {
                type: 'int',
                value: 45,
              },
            ],
            call_data: 'cb_KxEq+mD+G1qjoslB',
            caller_id: 'ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag',
            contract_id: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd',
            fee: 182220000000000,
            function: 'retip',
            gas: 1579000,
            gas_price: 1000000000,
            gas_used: 3267,
            log: [
              {
                address: 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd',
                data: 'cb_aHR0cHM6Ly9naXRodWIuY29tL3RoZXBpd2+QKOcm',
                topics: [
                  '48681722754138618263354476717335781731040556347805491032746127333257780314942',
                  '57639713195292369493552360805284271936076756489947923784567159882221348109905',
                  '100000000000000000',
                ],
              },
            ],
            nonce: 917,
            result: {
              type: 'unit',
              value: '',
            },
            return_type: 'ok',
            type: 'ContractCallTx',
            version: 1,
          },
          tx_index: 13883628,
        },
      ];

      const stub = sinon.stub(MdwLogic, 'middlewareContractTransactions').callsFake(async () => mockData);
      checkCachedRoute('/cache/events', 'array', () => {
        stub.restore();
        done();
      });
    });

    it(`it should GET all cached events in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/events', 'array', done);
    });

    it('it should invalidate the tips cache', done => {
      checkCachedRoute('/cache/invalidate/tips', 'object', done);
    });

    it('it should invalidate the oracle cache', done => {
      checkCachedRoute('/cache/invalidate/oracle', 'object', done);
    });

    it('it should invalidate the events cache', done => {
      checkCachedRoute('/cache/invalidate/events', 'object', done);
    });

    it('it should invalidate the token cache', function (done) {
      this.timeout(5000);
      // Just a random token contract, can be replaced anytime if its not working anymore
      const tokenAddress = 'ct_MRgnq6YXCi4Bd6CCks1bu8rTUfFmgLEAWWXVi7hSsJA4LZejs';
      checkCachedRoute(`/cache/invalidate/token/${tokenAddress}`, 'object', done);
    });

    it('it should GET all cached stats', async () => {
      await cache.del(['fetchStats']);
      const stub = sinon.stub(CacheLogic, 'getTips').callsFake(() => [
        {
          amount: '1000000000000000000',
          claim_gen: 1,
          sender: 'ak_tip1',
          url_id: 0,
          id: 0,
          url: 'url1',
          retips: [],
          claim: { unclaimed: false, claim_gen: 2, unclaimed_amount: 0 },
          amount_ae: '1',
          retip_amount_ae: '0',
          total_amount: '1',
          total_unclaimed_amount: '0',
          total_claimed_amount: '1',
          token_total_amount: [
            { token: 'T1', amount: '1' },
          ],
          token_total_unclaimed_amount: [
            { token: 'T1', amount: '1' },
          ],
        },
        {
          amount: '1000000000000000000',
          claim_gen: 2,
          sender: 'ak_tip2',
          timestamp: 1589530325248,
          title: '#test',
          url_id: 0,
          id: 0,
          url: 'https://github.com/thepiwo',
          topics: ['#test'],
          retips: [{
            amount: '1000000000000000000',
            claim_gen: 2,
            sender: 'ak_retip1',
            tip_id: 0,
            id: 0,
            claim: { unclaimed: true, claim_gen: 2, unclaimed_amount: 1 },
            amount_ae: '1',
          }],
          claim: { unclaimed: true, claim_gen: 2, unclaimed_amount: 1 },
          amount_ae: '1',
          retip_amount_ae: '1',
          total_amount: '2',
          total_unclaimed_amount: '1',
          total_claimed_amount: '1',
          token_total_amount: [
            { token: 'T1', amount: '2' },
            { token: 'T2', amount: '1' },
          ],
          token_total_unclaimed_amount: [
            { token: 'T1', amount: '1' },
            { token: 'T2', amount: '1' },
          ],
        },
      ]);
      const res = await chai.request(server).get('/cache/stats');
      stub.restore();
      res.should.have.status(200);

      res.body.should.have.property('tips_length', 2);
      res.body.should.have.property('retips_length', 1);
      res.body.should.have.property('total_tips_length', 3);
      res.body.should.have.property('total_amount', '3');
      res.body.should.have.property('total_unclaimed_amount', '1');
      res.body.should.have.property('senders');
      res.body.senders.should.eql(['ak_tip1', 'ak_tip2', 'ak_retip1']);
      res.body.should.have.property('senders_length', 3);
      res.body.should.have.property('token_total_amount');
      res.body.should.have.property('token_total_unclaimed_amount');
      res.body.token_total_amount[0].should.eql({ token: 'T1', amount: '3' });
      res.body.token_total_unclaimed_amount[0].should.eql({ token: 'T1', amount: '2' });
      res.body.should.have.property('by_url');
      res.body.by_url.should.be.an('Array');
      res.body.by_url.should.have.length(2);
    });

    it(`it should GET all cached stats in less than ${minimalTimeout}ms`, function (done) {
      this.timeout(minimalTimeout);
      checkCachedRoute('/cache/stats', 'object', done);
    });

    it('it should update the stats when the tip cache is invalidated', async function () {
      this.timeout(10000);
      await cache.del(['getTips']);
      const stub = sinon.stub(CacheLogic, 'statsForTips').callsFake(() => []);
      // Fake keep hot
      await CacheLogic.getTips();
      // Request stats
      const res = await chai.request(server).get('/cache/stats');
      res.should.have.status(200);

      stub.called.should.equal(true);
      stub.restore();
    });
  });
  describe('WordBazaar', () => {
    it('it should invalidate a wordSale cache', function (done) {
      this.timeout(5000);
      // Just a random token contract, can be replaced anytime if its not working anymore
      const wordSaleCtAddress = 'ct_RJt3nE2xwpA1Y95pkwyH7M5VthQUBd2TcdxuDZguGatQzKrWM';
      checkCachedRoute(`/cache/invalidate/wordSale/${wordSaleCtAddress}`, 'object', done);
    });

    it('it should invalidate the wordRegistry cache', done => {
      checkCachedRoute('/cache/invalidate/wordRegistry', 'object', done);
    });

    it('it should invalidate a wordSalesVote cache', function (done) {
      this.timeout(5000);
      // Just a random token contract, can be replaced anytime if its not working anymore
      const wordSaleCtAddress = 'ct_RJt3nE2xwpA1Y95pkwyH7M5VthQUBd2TcdxuDZguGatQzKrWM';
      checkCachedRoute(`/cache/invalidate/wordSaleVotes/${wordSaleCtAddress}`, 'object', done);
    });

    it('it should invalidate a wordSaleVoteState cache', function (done) {
      this.timeout(5000);
      // Just a random token contract, can be replaced anytime if its not working anymore
      const wordSaleCtAddress = 'ct_RJt3nE2xwpA1Y95pkwyH7M5VthQUBd2TcdxuDZguGatQzKrWM';
      checkCachedRoute(`/cache/invalidate/wordSaleVoteState/${wordSaleCtAddress}`, 'object', done);
    });
  });
});
