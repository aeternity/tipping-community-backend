const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');
const fs = require('fs');

const TipLogic = require('../logic/tipLogic');
const aeternity = require('../../aeternity/logic/aeternity');
const queueLogic = require('../../queue/logic/queueLogic');
const { MESSAGES } = require('../../queue/constants/queue');
const { MESSAGE_QUEUES } = require('../../queue/constants/queue');
const {
  Retip, Notification, Claim, BlacklistEntry, Comment,
} = require('../../../models');
const server = require('../../../server');
const { fakeTipsAndUpdateDB } = require('../../../utils/testingUtil');

const sampleTips = JSON.parse(fs.readFileSync(`${__dirname}/tips.json`));

chai.should();
chai.use(chaiHttp);

describe('(Re)Tips', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(queueLogic, 'sendMessage');
  });

  afterEach(() => {
    sandbox.restore();
  });
  const seedDB = fakeTipsAndUpdateDB([Claim, Retip, Notification, BlacklistEntry]);
  let isDirty = true;

  describe('API', () => {
    beforeEach(async () => {
      if (isDirty) {
        await seedDB(sampleTips);
        isDirty = false;
      }
    });

    it('it should respond with no tips when db is empty', async () => {
      const fakeData = {
        tips: [],
        retips: [],
        claims: [],
      };
      await fakeTipsAndUpdateDB(fakeData);
      const res = await chai.request(server).get('/tips');
      res.body.should.be.an('array');
      res.body.should.have.length(0);
    });

    it('it should respond with tips', async () => {
      const res = await chai.request(server).get('/tips');
      res.body.should.be.an('array');
      res.body.should.have.length(6);
    });

    it('it should apply pagination by default', async () => {
      let id = 0;
      const fakeData = {
        tips: [...(Array(35).fill(sampleTips.tips[0]).map(tip => ({
          ...tip,
          id: `${id++}_v1`,
        })))],
        retips: [],
        claims: [],
      };
      await fakeTipsAndUpdateDB(fakeData);

      const res = await chai.request(server).get('/tips');
      res.body.should.be.an('array');
      res.body.should.have.length(30);

      const res2 = await chai.request(server).get('/tips?page=2');
      res2.body.should.be.an('array');
      res2.body.should.have.length(5);
    });

    it('it should apply blacklist by default', async () => {
      // Reset db after this test
      isDirty = true;

      await BlacklistEntry.create({
        tipId: '1_v1',
      });

      const res = await chai.request(server).get('/tips');
      res.body.should.be.an('array');
      res.body.should.have.length(5);
      const ids = res.body.map(({ id }) => id);
      ids.should.not.contain('1_v1');
    });

    it('it should allow to bypass the blacklist', async () => {
      // Reset db after this test
      isDirty = true;
      await BlacklistEntry.create({
        tipId: '1_v1',
      });

      const res = await chai.request(server).get('/tips?blacklist=false');
      res.body.should.be.an('array');
      res.body.should.have.length(6);
    });

    it('it should allow to search by address', async () => {
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
      ids.should.eql(['2_v2', '1_v3', '2_v3', '1_v1', '2_v1', '1_v2']);
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
        '2_v2',
        '1_v3',
        '2_v3',
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
        '2_v2',
        '1_v3',
        '2_v3',
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
        totalUnclaimedAmount: '0',
        totalClaimedAmount: '130000000000000000',
        totalTokenAmount: [],
        totalTokenUnclaimedAmount: [],
        totalTokenClaimedAmount: [],
      });

      res.body.urlStats.should.eql({
        url: 'example.com',
        tipsLength: 1,
        retipsLength: 2,
        totalTipsLength: 3,
        totalAmount: '130000000000000000',
        totalUnclaimedAmount: '0',
        totalClaimedAmount: '130000000000000000',
        totalTokenAmount: [],
        totalTokenUnclaimedAmount: [],
        totalTokenClaimedAmount: [],
        senders: ['ak_retip_sender2', 'ak_retip_sender1', 'ak_sender1'],
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
      topicProperties.should.have.property('token_amount');
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
      topicProperties.should.have.property('token_amount');
      topicProperties.tokenAmount.should.eql([
        {
          token: 'ct_2bCbmU7vtsysL4JiUdUZjJJ98LLbJWG1fRtVApBvqSFEM59D6W',
          amount: '1100000000000000000',
        },
      ]);
    });

    it.skip('it should resolve existing tips on await endpoint in less than 1000ms', async function () {
      this.timeout(1000);
      await chai.request(server).get('/tips/await/tip/1_v2');
    });

    it.skip('it should resolve new tips when they are added for v1', done => {
      chai.request(server).get('/tips/await/tip/10_v1').then(res => {
        res.should.have.status(200);
        done();
      });
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.tips[fakeData.tips.length - 1].id = '10_v1';
      fakeTipsAndUpdateDB(fakeData);
    });

    it('it should resolve new tips when they are added for v2', done => {
      chai.request(server).get('/tips/await/tip/10_v2').then(res => {
        res.should.have.status(200);
        done();
      });
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.tips[fakeData.tips.length - 1].id = '10_v2';
      fakeTipsAndUpdateDB(fakeData);
    });

    it('it should resolve new tips when they are added for v3', done => {
      chai.request(server).get('/tips/await/tip/10_v3').then(res => {
        res.should.have.status(200);
        done();
      });
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.tips[fakeData.tips.length - 1].id = '10_v3';
      fakeTipsAndUpdateDB(fakeData);
    });

    it.skip('it should resolve new re-tips when they are added for v1', done => {
      chai.request(server).get('/tips/await/retip/10_v1').then(res => {
        res.should.have.status(200);
        done();
      });
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.retips[fakeData.retips.length - 1].id = '10_v1';
      fakeTipsAndUpdateDB(fakeData);
    });

    it('it should resolve new re-tips when they are added for v2', done => {
      chai.request(server).get('/tips/await/retip/10_v2').then(res => {
        res.should.have.status(200);
        done();
      });
      const fakeData = JSON.parse(JSON.stringify(sampleTips));
      fakeData.retips[fakeData.retips.length - 1].id = '10_v2';
      fakeTipsAndUpdateDB(fakeData);
    });
  });

  describe('DB', () => {
    isDirty = true;
    beforeEach(async () => {
      if (isDirty) {
        await fakeTipsAndUpdateDB(sampleTips);
        isDirty = false;
      }
    });

    it.skip('it should treat inserted tips without claims as unclaimed', async () => {
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
        contractId: 'ct_2ZEoCKcqXkbz2uahRrsWeaPooZs9SdCv6pmC4kc55rD4MhqYSu',
        url: 'https://another.random.domain',
        claimGen: 1,
        amount: '0',
      });
      await fakeTipsAndUpdateDB(fakeData, false);
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
    it('it should update the tips on MESSAGES.TIPS.COMMANDS.UPDATE_CLAIMS', done => {
      sandbox.restore();
      const updateMock = sinon.stub(TipLogic, 'updateTipsRetipsClaimsDB').callsFake(async () => {});
      queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.COMMANDS.UPDATE_CLAIMS);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        updateMock.restore();
        done();
      }, 100);
    });

    it('it should update the tips on MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_TIPS_RETIPS_CLAIMS', done => {
      sandbox.restore();
      const updateMock = sinon.stub(TipLogic, 'updateTipsRetipsClaimsDB').callsFake(async () => {});
      queueLogic.sendMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, MESSAGES.SCHEDULED_EVENTS.COMMANDS.UPDATE_TIPS_RETIPS_CLAIMS);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        updateMock.restore();
        done();
      }, 100);
    });

    it('it should insert the payload on MESSAGES.TIPS.COMMANDS.INSERT_TIP', done => {
      sandbox.restore();
      const updateMock = sinon.stub(TipLogic, 'insertTips').callsFake(async () => {});
      const payload = {
        test: 'test',
      };
      queueLogic.sendMessage(MESSAGE_QUEUES.TIPS, MESSAGES.TIPS.COMMANDS.INSERT_TIP, payload);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        sinon.assert.calledWith(updateMock, [payload]);
        updateMock.restore();
        done();
      }, 100);
    });

    it('it should insert the payload on MESSAGES.RETIPS.COMMANDS.INSERT_RETIP', done => {
      sandbox.restore();
      const updateMock = sinon.stub(TipLogic, 'insertRetips').callsFake(async () => {});
      const payload = {
        test: 'test',
      };
      queueLogic.sendMessage(MESSAGE_QUEUES.RETIPS, MESSAGES.RETIPS.COMMANDS.INSERT_RETIP, payload);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        sinon.assert.calledWith(updateMock, [payload]);
        updateMock.restore();
        done();
      }, 100);
    });
  });
});
