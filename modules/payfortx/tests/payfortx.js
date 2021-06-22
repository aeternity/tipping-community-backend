const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, before } = require('mocha');
const sinon = require('sinon');

const { Crypto } = require('@aeternity/aepp-sdk');
const tippingContractUtil = require('tipping-contract/util/tippingContractUtil');
const BigNumber = require('bignumber.js');
const ae = require('../../aeternity/logic/aeternity');
const server = require('../../../server');
const Trace = require('../logic/traceLogic');
const TipLogic = require('../../tip/logic/tipLogic');
const { TRACE_STATES } = require('../constants/traceStates');
const { publicKey, secretKey } = require('../../../utils/testingUtil');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Pay for TX', () => {
  describe('Claiming', () => {
    describe('Flat API Tests', () => {
      it('it should fail without body', done => {
        chai.request(server).post('/claim/submit').send({}).end((err, res) => {
          res.should.have.status(400);
          done();
        });
      });

      it('it should fail without address', done => {
        chai.request(server).post('/claim/submit').send({
          url: 'https://aeternity.com',
        }).end((err, res) => {
          res.should.have.status(400);
          done();
        });
      });

      it('it should fail without url', done => {
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
        await ae.init();
      });

      it('it should reject on website not in contract with zero amount', async function () {
        this.timeout(10000);
        const res = await chai.request(server).post('/claim/submit').send({
          address: publicKey,
          url: 'https://complicated.domain.test',
        });
        res.should.have.status(400);
        res.body.should.have.property('error', 'No zero amount claims');
      });

      it('it should accept if pre-claim was successful', async function () {
        this.timeout(10000);
        const preClaimStub = sinon.stub(ae, 'getTotalClaimableAmount').resolves(new BigNumber(100000));
        const claimStub = sinon.stub(ae, 'claimTips').resolves(true);
        const res = await chai.request(server).post('/claim/submit').send({
          address: publicKey,
          url: 'https://complicated.domain.test',
        });
        res.should.have.status(200);
        res.body.should.have.property('claimUUID');
        claimStub.called.should.equal(true);
        const trace = new Trace(res.body.claimUUID);
        const lastElement = trace.data[trace.data.length - 1];
        lastElement.should.have.property('result', 'success');
        lastElement.should.have.property('state', TRACE_STATES.FINISHED);
        claimStub.restore();
        preClaimStub.restore();
      });
    });
  });

  describe('Post to V3', () => {
    before(async function () {
      this.timeout(25000);
      await ae.init();
    });
    after(() => {
      sinon.restore();
    });

    it('it should post a tip', async function () {
      this.timeout(20000);

      const testData = {
        author: publicKey,
        title: 'A random post',
        media: ['https://complicated.domain.test'],
      };

      const message = tippingContractUtil.postWithoutTippingString(testData.title, testData.media);
      const hash = Crypto.hash(message);
      const signature = Crypto.signMessage(hash, Buffer.from(secretKey, 'hex'));

      sinon.stub(ae, 'postTipToV3').callsFake((title, media, author, passedSignature) => {
        title.should.equal(testData.title);
        media.should.deep.equal(testData.media);
        author.should.equal(publicKey);
        const verified = Crypto.verifyMessage(hash, passedSignature, Crypto.decodeBase58Check(publicKey.substr(3)));
        verified.should.equal(true);
        return { hash: 'hash', decodedResult: '1' };
      });
      const awaitStub = sinon.stub(TipLogic, 'awaitTipsUpdated').callsFake(async () => {});

      const res = await chai.request(server).post('/payfortx/post').send({
        author: publicKey,
        title: testData.title,
        signature: Buffer.from(signature).toString('hex'),
        media: testData.media,
      });

      res.should.have.status(200);
      res.body.should.deep.equal({ tx: { hash: 'hash', decodedResult: '1' } });
      sinon.assert.calledWith(awaitStub, '1_v3');
    });
  });
});
