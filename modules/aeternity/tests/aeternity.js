// Require the dev-dependencies
const chai = require('chai');
const {
  describe, it, afterEach,
} = require('mocha');
const sinon = require('sinon');

const BigNumber = require('bignumber.js');
const ae = require('../logic/aeternity');
const Trace = require('../../payfortx/logic/traceLogic');

const should = chai.should();
// Our parent block
describe('Aeternity', () => {
  describe('Init', () => {
    it('it should init', async function () {
      this.timeout(20000);
      await ae.init();
    });

    it('it should get the network id', async () => {
      const result = await ae.networkId();
      result.should.equal('ae_uat');
    });
  });
  describe('Oracle', () => {
    before(async function () {
      this.timeout(20000);
      await ae.init();
    });
    afterEach(() => {
      sinon.restore();
    });

    it('it should get all oracle claimed urls', async function () {
      this.timeout(30000);
      const result = await ae.getOracleAllClaimedUrls();
      result.should.be.an('array');
      result.should.include('https://github.com/mradkov');
    });

    it('it should get the oracle claim by url', async function () {
      this.timeout(30000);
      const result = await ae.fetchOracleClaimByUrl('https://github.com/mradkov');
      result.should.be.an('object');
      result.should.have.property('success');
      result.should.have.property('percentage');
      result.should.have.property('account');
    });

    it('it should get the oracle claim by address', async function () {
      this.timeout(30000);
      const result = await ae.fetchOracleClaimedUrls('ak_YCwfWaW5ER6cRsG9Jg4KMyVU59bQkt45WvcnJJctQojCqBeG2');
      result.should.be.an('array');
      result.should.include('https://github.com/mradkov');
    });
  });

  describe('Claiming', () => {
    before(async function () {
      this.timeout(20000);
      await ae.init();
    });
    afterEach(() => {
      sinon.restore();
    });

    it('it should get the tips, retips & claims', async function () {
      this.timeout(15000);
      const result = await ae.fetchStateBasic();
      result.should.be.an('object');
      result.should.have.property('tips');
      result.should.have.property('retips');
      result.should.have.property('claims');

      const [firstTip] = result.tips;
      firstTip.should.have.property('amount');
      firstTip.should.have.property('sender');
      firstTip.should.have.property('timestamp');
      firstTip.should.have.property('title');
      firstTip.should.have.property('type');
      firstTip.should.have.property('claimGen');
      firstTip.should.have.property('id');
      firstTip.id.should.be.an('String');
      firstTip.should.have.property('contractId');
      firstTip.should.have.property('url');
      firstTip.should.have.property('urlId');
      firstTip.should.have.property('topics');
      firstTip.should.have.property('token');
      firstTip.should.have.property('tokenAmount');

      const [firstRetip] = result.retips;
      firstRetip.should.have.property('amount');
      firstRetip.should.have.property('sender');
      firstRetip.should.have.property('tipId');
      firstRetip.should.have.property('id');
      firstRetip.should.have.property('contractId');
      firstRetip.should.have.property('claimGen');
      firstRetip.should.have.property('token');
      firstRetip.should.have.property('tokenAmount');

      const [firstClaim] = result.claims;
      firstClaim.should.have.property('contractId');
      firstClaim.should.have.property('url');
      firstClaim.should.have.property('claimGen');
      firstClaim.should.have.property('amount');
    });

    it('it should fail pre-claiming an non existing tip', async function () {
      this.timeout(10000);
      // CHECK V2
      const resultV2 = await ae.getTotalClaimableAmount('https://probably.not.an.existing.tip', new Trace());
      resultV2.should.be.an.instanceOf(BigNumber);
      resultV2.toFixed(0).should.eql('0');
    });

    const url = 'https://probably.not.an.existing.tip';
    const address = 'ak_YCwfWaW5ER6cRsG9Jg4KMyVU59bQkt45WvcnJJctQojCqBeG2';

    it('it should succeed claiming with V1 stubs', async function () {
      this.timeout(10000);
      const stubClaimAmount = sinon.stub(ae, 'getClaimableAmount').resolves(new BigNumber('1'));
      const stubCheckClaim = sinon.stub(ae, 'checkClaimOnContract').resolves(true);
      const stubClaim = sinon.stub(ae, 'claimOnContract').resolves(true);
      const trace = new Trace();
      await ae.claimTips(address, url, trace);
      stubClaimAmount.called.should.equal(true);
      sinon.assert.calledWith(stubClaimAmount, url, trace);
      stubCheckClaim.called.should.equal(true);
      sinon.assert.calledWith(stubCheckClaim, address, url, trace);
      stubClaim.called.should.equal(true);
      sinon.assert.calledWith(stubClaim, address, url, trace);
    });

    it('it should succeed claiming with V1 + V2 stubs', async function () {
      this.timeout(10000);
      const stubClaimAmount = sinon.stub(ae, 'getClaimableAmount')
        .onFirstCall().returns(new BigNumber('0'))
        .onSecondCall()
        .returns(new BigNumber('1'));
      const stubCheckClaim = sinon.stub(ae, 'checkClaimOnContract').resolves(true);
      const stubClaim = sinon.stub(ae, 'claimOnContract').resolves(true);
      const trace = new Trace();
      await ae.claimTips(address, url, trace);
      stubClaimAmount.calledTwice.should.equal(true);
      sinon.assert.calledWith(stubClaimAmount, url, trace, sinon.match.object);
      stubCheckClaim.calledOnce.should.equal(true);
      sinon.assert.calledWith(stubCheckClaim, address, url);
      stubClaim.calledOnce.should.equal(true);
      sinon.assert.calledWith(stubClaim, address, url);
    });
  });
  describe('Tokens', () => {
    let tokenContractAddress;

    afterEach(() => {
      sinon.restore();
    });
    it('it should get the token registry state', async function () {
      this.timeout(10000);
      const result = await ae.fetchTokenRegistryState();
      result.should.be.an('array');
      const [firstEntry] = result;
      firstEntry.should.be.an('array');

      // token contract address
      firstEntry[0].should.be.an('string');
      firstEntry[0].should.contain('ct_');

      // token contract meta infos
      firstEntry[1].should.be.an('object');
      firstEntry[1].should.have.property('decimals');
      firstEntry[1].should.have.property('name');
      firstEntry[1].should.have.property('symbol');
      [tokenContractAddress] = firstEntry;
    });
    it('it should get the token meta info from a contract', async function () {
      this.timeout(10000);
      const result = await ae.fetchTokenMetaInfo(tokenContractAddress);
      result.should.be.an('object');
      result.should.have.property('decimals');
      result.should.have.property('name');
      result.should.have.property('symbol');
    });

    it('it should get the account balances from a contract', async function () {
      this.timeout(10000);
      const result = await ae.fetchTokenAccountBalances(tokenContractAddress);
      result.should.be.an('array');
      if (result.length !== 0) {
        const [[address, balance]] = result;
        address.should.be.an('string');
        address.should.contain('ak_');
        if (balance === 0) {
          balance.should.be.an('number');
        } else {
          balance.should.be.an('string');
          const intBalance = parseInt(balance, 10);
          intBalance.should.be.greaterThan(0);
        }
      }
    });
  });
  describe('Resilience', () => {
    before(async function () {
      this.timeout(10000);
      await ae.init();
    });

    after(async function () {
      this.timeout(15000);
      await ae.resetClient();
    });

    it('should handle a non responding compiler during runtime', async function () {
      this.timeout(10000);
      const client = ae.getClient();
      client.selectedNode.instance.url = 'https://localhost';
      const staticStub = sinon.stub(client, 'contractCallStatic').callsFake(() => { throw new Error('NETWORK ERROR'); });
      const callStub = sinon.stub(client, 'contractCall').callsFake(() => { throw new Error('NETWORK ERROR'); });
      const state = await ae.fetchStateBasic();
      state.should.be.an('object');
      state.should.have.property('tips');
      state.should.have.property('retips');
      state.should.have.property('claims');
      state.tips.should.have.length(0);
      state.retips.should.have.length(0);
      state.claims.should.have.length(0);
      const tokenBalances = await ae.fetchTokenAccountBalances('ct_2bCbmU7vtsysL4JiUdUZjJJ98LLbJWG1fRtVApBvqSFEM59D6W');
      should.equal(tokenBalances, null);
      const trace = new Trace();
      const preClaim = await ae.getTotalClaimableAmount('http://test', trace);
      should.equal(preClaim.toFixed(0), '0');

      const registryState = await ae.fetchTokenRegistryState();
      registryState.should.be.an('array');
      registryState.should.have.length(0);

      staticStub.restore();
      callStub.restore();
    });

    it('should crash for a non responding node on startup', async function () {
      this.timeout(10000);
      const originalUrl = process.env.NODE_URL;
      process.env.NODE_URL = 'https://localhost';
      let error = '';
      try {
        await ae.resetClient();
      } catch (e) {
        error = e.message;
      }
      error.should.contain('connect ECONNREFUSED 127.0.0.1:443');
      process.env.NODE_URL = originalUrl;
    });
    it('should crash for a non responding compiler on startup', async function () {
      this.timeout(10000);
      const originalUrl = process.env.COMPILER_URL;
      process.env.COMPILER_URL = 'https://localhost';
      let error = '';
      try {
        await ae.resetClient();
      } catch (e) {
        error = e.message;
      }
      error.should.contain('Compiler not defined');
      process.env.COMPILER_URL = originalUrl;
    });
    after(async function () {
      this.timeout(10000);
      ae.client = null;
      await ae.init();
    });
  });
});
