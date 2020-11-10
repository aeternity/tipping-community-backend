const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, before } = require('mocha');
const sinon = require('sinon');

const { Crypto } = require('@aeternity/aepp-sdk');
const tippingContractUtil = require('tipping-contract/util/tippingContractUtil');
const ae = require('../utils/aeternity.js');
const server = require('../server.js');
const { publicKey, secretKey } = require('../utils/testingUtil.js');

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

      it('it should reject on website not in contract', done => {
        chai.request(server).post('/claim/submit').send({
          address: publicKey,
          url: 'https://complicated.domain.test',
        }).end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('error', 'No zero amount claims');
          done();
        });
      }).timeout(10000);
    });
  });

  describe('Post to V3', () => {
    before(async function () {
      this.timeout(25000);
      await ae.init();
    });

    it('it should post a contract without', async function () {
      this.timeout(20000);

      const testData = {
        author: publicKey,
        title: 'A random post',
        media: ['https://complicated.domain.test'],
      };

      const message = tippingContractUtil.postWithoutTippingString(testData.title, testData.media);
      const hash = Crypto.hash(message);
      const signature = Crypto.signPersonalMessage(hash, Buffer.from(secretKey, 'hex'));

      const postStub = sinon.stub(ae.contractV3.methods, 'post_without_tip_sig').callsFake((title, media, author, passedSignature) => {
        title.should.equal(testData.title);
        media.should.deep.equal(testData.media);
        author.should.equal(publicKey);
        const verified = Crypto.verifyPersonalMessage(hash, passedSignature, Crypto.decodeBase58Check(publicKey.substr(3)));
        verified.should.equal(true);
        return { hash: 'hash' };
      });

      const res = await chai.request(server).post('/payfortx/post').send({
        author: publicKey,
        title: testData.title,
        signature: Buffer.from(signature).toString('hex'),
        media: testData.media,
      });

      res.should.have.status(200);
      res.body.should.deep.equal({ tx: { hash: 'hash' } });
      postStub.restore();
    });
  });
});
