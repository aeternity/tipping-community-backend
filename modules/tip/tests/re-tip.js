const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const TipLogic = require('../logic/tipLogic');
const queueLogic = require('../../queue/logic/queueLogic');
const { MESSAGES } = require('../../queue/constants/queue');
const { MESSAGE_QUEUES } = require('../../queue/constants/queue');
const {
  Retip, Notification, Claim, BlacklistEntry, Comment,
} = require('../../../models');
const server = require('../../../server');
const { getDBSeedFunction } = require('../../../utils/testingUtil');

const sampleTips = require('./sampleTips');
const aeternity = require('../../aeternity/logic/aeternity');

chai.should();
chai.use(chaiHttp);

describe('(Re)Tips', () => {
  before(() => {
    sinon.stub(queueLogic, 'sendMessage');
  });

  after(() => {
    sinon.restore();
  });
  const seedDB = getDBSeedFunction([Claim, Retip, Notification, BlacklistEntry]);

  describe('API', () => {
    it('it should respond with no tips when db is empty', async function () {
      this.timeout(5000);
      const fakeData = {
        tips: [],
        retips: [],
        claims: [],
      };
      await seedDB(fakeData);
      const res = await chai.request(server).get('/tips');
      res.body.should.be.an('array');
      res.body.should.have.length(0);
    });

    it('it should respond with tips', async function () {
      this.timeout(5000);
      await seedDB(sampleTips);
      const res = await chai.request(server).get('/tips');
      res.body.should.be.an('array');
      res.body.should.have.length(6);
    });

    it('it should apply pagination by default', async function () {
      this.timeout(5000);
      let id = 0;
      const fakeData = {
        tips: [...(Array(35).fill(sampleTips.tips[0]).map(tip => ({
          ...tip,
          id: `${id++}_v1`,
        })))],
        retips: [],
        claims: [],
      };
      await seedDB(fakeData);

      const res = await chai.request(server).get('/tips');
      res.body.should.be.an('array');
      res.body.should.have.length(30);

      const res2 = await chai.request(server).get('/tips?page=2');
      res2.body.should.be.an('array');
      res2.body.should.have.length(5);
    });

    it('it should apply blacklist by default', async function () {
      this.timeout(5000);
      await seedDB(sampleTips);
      await BlacklistEntry.create({
        tipId: '1_v1',
      });

      const res = await chai.request(server).get('/tips');
      res.body.should.be.an('array');
      res.body.should.have.length(5);
      const ids = res.body.map(({ id }) => id);
      ids.should.not.contain('1_v1');
      await BlacklistEntry.truncate();
    });

    it('it should allow to bypass the blacklist', async () => {
      await BlacklistEntry.create({
        tipId: '1_v1',
      });

      const res = await chai.request(server).get('/tips?blacklist=false');
      res.body.should.be.an('array');
      res.body.should.have.length(6);
      await BlacklistEntry.truncate();
    });

    it('it should allow to search by address', async function () {
      this.timeout(5000);
      await seedDB(sampleTips);
      const res = await chai.request(server).get('/tips?address=ak_sender1');
      res.body.should.be.an('array');
      res.body.should.have.length(2);
    });

    it('it should return an empty result when address has not yet tipped', async () => {
      const res = await chai.request(server).get('/tips?address=ak_sender0');
      res.body.should.be.an('array');
      res.body.should.have.length(0);
    });

    it('it should return an empty result when address has only re-tipped', async () => {
      const res = await chai.request(server).get('/tips?address=ak_retip_sender1');
      res.body.should.be.an('array');
      res.body.should.have.length(0);
    });

    it('it should allow filtering by contract version', async () => {
      const res = await chai.request(server).get('/tips?contractVersion=v1');
      res.body.should.be.an('array');
      res.body.should.have.length(2);
    });

    it('it should allow filtering by multiple contract versions', async () => {
      const res = await chai.request(server).get('/tips?contractVersion=v1&contractVersion=v2');
      res.body.should.be.an('array');
      res.body.should.have.length(4);
    });

    it('it should allow filtering by token', async () => {
      const res = await chai.request(server).get('/tips?token=ct_2bCbmU7vtsysL4JiUdUZjJJ98LLbJWG1fRtVApBvqSFEM59D6W');
      res.body.should.be.an('array');
      res.body.should.have.length(2);
    });

    it('it should allow searching by title', async () => {
      const res = await chai.request(server).get('/tips?search=test');
      res.body.should.be.an('array');
      res.body.should.have.length(4);
    });

    it('it should allow searching by topic', async () => {
      const res = await chai.request(server).get('/tips?search=%23test');
      res.body.should.be.an('array');
      res.body.should.have.length(2);
    });

    it('it should allow searching by url', async () => {
      const res = await chai.request(server).get('/tips?search=example.com');
      res.body.should.be.an('array');
      res.body.should.have.length(3);
    });

    it('it should allow searching by address', async () => {
      const res = await chai.request(server).get('/tips?search=ak_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd');
      res.body.should.be.an('array');
      res.body.should.have.length(1);
    });

    it('it should allow filtering by language', async () => {
      const res = await chai.request(server).get('/tips?language=de');
      res.body.should.be.an('array');
      res.body.should.have.length(1);

      const res2 = await chai.request(server).get('/tips?language=de&language=en');
      res2.body.should.be.an('array');
      res2.body.should.have.length(3);
    });

    it('it should sorting by latest', async () => {
      const res = await chai.request(server).get('/tips?ordering=latest');
      res.body.should.be.an('array');
      res.body.should.have.length(6);
      const ids = res.body.map(({ id }) => id);
      ids.should.eql([
        '2_v3',
        '1_v3',
        '2_v2',
        '1_v2',
        '2_v1',
        '1_v1',
      ]);
    });

    it('it should sorting by score', async () => {
      const res = await chai.request(server).get('/tips?ordering=hot');
      res.body.should.be.an('array');
      res.body.should.have.length(6);
      const ids = res.body.map(({ id }) => id);
      // TODO might be unstable
      ids.should.eql([
        '1_v2',
        '1_v1',
        '2_v1',
        '2_v3',
        '1_v3',
        '2_v2',
      ]);
    });

    it('it should sorting by total amount (default)', async () => {
      const res = await chai.request(server).get('/tips');
      res.body.should.be.an('array');
      res.body.should.have.length(6);
      const ids = res.body.map(({ id }) => id);
      // TODO might be unstable
      ids.should.eql([
        '1_v2',
        '1_v1',
        '2_v1',
        '2_v3',
        '1_v3',
        '2_v2',
      ]);
    });

    it('it should return 404 on invalid tipid', async () => {
      const res = await chai.request(server).get('/tips/123_v1');
      res.should.have.status(404);
    });

    it('it should return a single tip', async () => {
      await Comment.create({
        tipId: '1_v1', text: 'text', author: 'author', signature: 'signature', challenge: 'challenge',
      });

      const res = await chai.request(server).get('/tips/single/1_v1');
      res.body.should.have.property('id', '1_v1');
      res.body.aggregation.should.eql({
        id: '1_v1',
        totalAmount: '130000000000000000',
        totalUnclaimedAmount: '130000000000000000',
        totalClaimedAmount: '0',
        totalTokenAmount: [],
        totalTokenUnclaimedAmount: [],
        totalTokenClaimedAmount: [],
      });

      // sort the result to avoid flaky tests
      res.body.urlStats.senders.sort();
      res.body.urlStats.should.eql({
        url: 'example.com',
        tipsLength: 1,
        retipsLength: 2,
        totalTipsLength: 3,
        totalAmount: '130000000000000000',
        totalUnclaimedAmount: '130000000000000000',
        totalClaimedAmount: '0',
        totalTokenAmount: [],
        totalTokenUnclaimedAmount: [],
        totalTokenClaimedAmount: [],
        senders: ['ak_retip_sender1', 'ak_retip_sender2', 'ak_sender1'],
        sendersLength: 3,
      });

      res.body.should.have.property('commentCount', '1');

      await Comment.truncate({
        cascade: true,
      });
    });

    it('it should get the topics', async () => {
      const res = await chai.request(server).get('/tips/topics');
      res.body.should.be.an('array');
      res.body.should.have.length(3);
      const [firstTopic] = res.body;
      firstTopic.should.be.an('array');
      firstTopic.should.have.length(2);
      const [topic, topicProperties] = firstTopic;
      topic.should.eql('#test');
      topicProperties.should.have.property('amount', '330000000000000000');
      topicProperties.should.have.property('count', 2);
      topicProperties.should.have.property('tokenAmount');
      topicProperties.tokenAmount.should.eql([
        {
          token: 'ct_2bCbmU7vtsysL4JiUdUZjJJ98LLbJWG1fRtVApBvqSFEM59D6W',
          amount: '1100000000000000000',
        },
      ]);
    });

    it('it should be able to await a newly made tip', async () => {
      const res = await chai.request(server).get('/tips/topics');
      res.body.should.be.an('array');
      res.body.should.have.length(3);
      const [firstTopic] = res.body;
      firstTopic.should.be.an('array');
      firstTopic.should.have.length(2);
      const [topic, topicProperties] = firstTopic;
      topic.should.eql('#test');
      topicProperties.should.have.property('amount', '330000000000000000');
      topicProperties.should.have.property('count', 2);
      topicProperties.should.have.property('tokenAmount');
      topicProperties.tokenAmount.should.eql([
        {
          token: 'ct_2bCbmU7vtsysL4JiUdUZjJJ98LLbJWG1fRtVApBvqSFEM59D6W',
          amount: '1100000000000000000',
        },
      ]);
    });

    it('it should resolve existing tips on await endpoint in less than 1000ms', async function () {
      this.timeout(1000);
      await chai.request(server).get('/tips/await/tip/1_v2');
    });

    it('it should resolve new tips when they are added for v1', async function () {
      this.timeout(5000);
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.tips[fakeData.tips.length - 1].id = '10_v1';
      const [res] = await Promise.all([
        chai.request(server).get('/tips/await/tip/v1'),
        seedDB(fakeData),
      ]);
      res.should.have.status(200);
    });

    it('it should resolve new tips when they are added for v2', async function () {
      this.timeout(5000);
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.tips[fakeData.tips.length - 1].id = '10_v2';
      const [res] = await Promise.all([
        chai.request(server).get('/tips/await/tip/10_v2'),
        seedDB(fakeData),
      ]);
      res.should.have.status(200);
    });

    it('it should resolve new tips when they are added for v3', async function () {
      this.timeout(5000);
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.tips[fakeData.tips.length - 1].id = '10_v3';
      const [res] = await Promise.all([
        chai.request(server).get('/tips/await/tip/10_v3'),
        seedDB(fakeData),
      ]);
      res.should.have.status(200);
    });

    it('it should resolve new tips when they are added for v4', async function () {
      this.timeout(5000);
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.tips[fakeData.tips.length - 1].id = '10_v4';
      const [res] = await Promise.all([
        chai.request(server).get('/tips/await/tip/10_v4'),
        seedDB(fakeData),
      ]);
      res.should.have.status(200);
    });

    it('it should resolve new re-tips when they are added for v1', async function () {
      this.timeout(5000);
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.retips[fakeData.retips.length - 1].id = '10_v1';
      const [res] = await Promise.all([
        chai.request(server).get('/tips/await/retip/v1'),
        seedDB(fakeData),
      ]);
      res.should.have.status(200);
    });

    it('it should resolve new re-tips when they are added for v2', async function () {
      this.timeout(5000);
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.retips[fakeData.retips.length - 1].id = '10_v2';
      const [res] = await Promise.all([
        chai.request(server).get('/tips/await/retip/10_v2'),
        seedDB(fakeData),
      ]);
      res.should.have.status(200);
    });
  });

  describe('DB', () => {
    it('it should treat inserted tips without claims as unclaimed', async () => {
      await seedDB(sampleTips);
      const res = await chai.request(server).get('/tips/single/2_v2');
      res.body.should.have.property('id', '2_v2');
      res.body.should.have.property('aggregation');
      res.body.aggregation.should.have.property('totalTokenUnclaimedAmount');
      res.body.aggregation.totalTokenUnclaimedAmount.should.be.eql([
        {
          token: 'ct_2bCbmU7vtsysL4JiUdUZjJJ98LLbJWG1fRtVApBvqSFEM59D6W',
          amount: '100000000000000000',
        },
      ]);
    });

    it('it should UPDATE a tips claimed status db', async () => {
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.claims.push({
        contractId: aeternity.contractAddressForVersion('v2'),
        url: 'https://another.random.domain',
        claimGen: 1,
        amount: '0',
      });
      await seedDB(fakeData, false);
      const res = await chai.request(server).get('/tips/single/2_v2');
      res.body.should.have.property('id', '2_v2');
      res.body.should.have.property('aggregation');
      res.body.aggregation.should.have.property('totalTokenClaimedAmount');
      res.body.aggregation.totalTokenClaimedAmount.should.be.eql([
        {
          token: 'ct_2bCbmU7vtsysL4JiUdUZjJJ98LLbJWG1fRtVApBvqSFEM59D6W',
          amount: '100000000000000000',
        },
      ]);

      res.body.should.have.property('claim');
      res.body.claim.should.be.an('object');
      res.body.claim.should.have.property('claimGen', 1);
    });
  });

  describe('Internals', () => {
    before(() => {
      TipLogic.init();
    });
    beforeEach(() => {
      sinon.restore();
    });

    it('it should update everything on MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_TIPS_RETIPS_CLAIMS', done => {
      const updateMock = sinon.stub(TipLogic, 'updateTipsRetipsClaimsDB').callsFake(async () => {});
      queueLogic.sendMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_TIPS_RETIPS_CLAIMS);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        done();
      }, 100);
    });

    it('it should insert the claim on MESSAGES.TIPS.COMMANDS.INSERT_CLAIM', done => {
      const updateMock = sinon.stub(TipLogic, 'insertClaims').callsFake(async ([payload]) => payload);
      const payload = {
        test: 'test',
      };
      queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.COMMANDS.INSERT_CLAIM, payload);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        sinon.assert.calledWith(updateMock, [payload]);
        done();
      }, 100);
    });

    it('it should insert the payload on MESSAGES.TIPS.COMMANDS.INSERT_TIP', done => {
      const updateMock = sinon.stub(TipLogic, 'insertTips').callsFake(async () => {});
      const payload = {
        test: 'test',
      };
      queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.COMMANDS.INSERT_TIP, payload);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        sinon.assert.calledWith(updateMock, [payload]);
        done();
      }, 100);
    });

    it('it should insert the payload on MESSAGES.RETIPS.COMMANDS.INSERT_RETIP', done => {
      const updateMock = sinon.stub(TipLogic, 'insertRetips').callsFake(async () => {});
      const payload = {
        test: 'test',
      };
      queueLogic.sendMessage(MESSAGE_QUEUES.RETIPS, MESSAGES.RETIPS.COMMANDS.INSERT_RETIP, payload);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        sinon.assert.calledWith(updateMock, [payload]);
        done();
      }, 100);
    });
  });
});
