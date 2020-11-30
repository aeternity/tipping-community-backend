// Require the dev-dependencies
const chai = require('chai');
const {
  describe, it, beforeEach, afterEach,
} = require('mocha');
const sinon = require('sinon');

const ae = require('../logic/aeternity');
const Trace = require('../../payfortx/logic/traceLogic');

chai.should();

// Our parent block
describe('Aeternity', () => {
  describe('Init', () => {
    it('it should init', async function () {
      this.timeout(5000);
      await ae.init();
    });

    it('it should get the network id', async () => {
      const result = await ae.networkId();
      result.should.equal('ae_uat');
    });
  });
  describe('Claiming', () => {
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('it should get the oracle state', async function () {
      this.timeout(30000);
      const result = await ae.fetchOracleState();
      result.should.be.an('object');
      result.should.have.property('minimum_amount_of_oracles');
      result.should.have.property('oracle_queries');
      result.should.have.property('owner');
      result.should.have.property('success_claimed_urls');
      result.should.have.property('trusted_oracle_seq');
      result.should.have.property('trusted_oracles');
    });

    it('it should get the tips', async function () {
      this.timeout(10000);
      const result = await ae.fetchTips();
      result.should.be.an('array');
      if (result.length > 0) {
        const firstEntry = result[0];
        firstEntry.should.have.property('amount');
        firstEntry.should.have.property('claim_gen');
        firstEntry.should.have.property('sender');
        firstEntry.should.have.property('timestamp');
        firstEntry.should.have.property('title');
        firstEntry.should.have.property('url_id');
        firstEntry.should.have.property('id');
        firstEntry.id.should.be.an('String');
        firstEntry.should.have.property('url');
        firstEntry.should.have.property('topics');
        firstEntry.should.have.property('retips');
        firstEntry.should.have.property('claim');
        firstEntry.should.have.property('amount_ae');
        firstEntry.should.have.property('total_amount');
        firstEntry.should.have.property('total_amount_ae');
        firstEntry.should.have.property('total_claimed_amount');
        firstEntry.should.have.property('total_claimed_amount_ae');
        firstEntry.should.have.property('total_unclaimed_amount');
        firstEntry.should.have.property('total_unclaimed_amount_ae');
        firstEntry.should.have.property('token_total_amount');
        firstEntry.should.have.property('token_total_unclaimed_amount');
      }
    });

    it('it should fail pre-claiming an non existing tip', async function () {
      this.timeout(10000);

      // CHECK V1
      let result = await ae.preClaim('not_a_real_account', 'https://probably.not.an.existing.tip', new Trace(), ae.contractV1);
      result.should.be.a('boolean');
      result.should.eql(false);

      // CHECK V2
      result = await ae.preClaim('not_a_real_account', 'https://probably.not.an.existing.tip', new Trace(), ae.contractV2);
      result.should.be.a('boolean');
      result.should.eql(false);
    });

    const url = 'https://probably.not.an.existing.tip';
    const address = 'ak_YCwfWaW5ER6cRsG9Jg4KMyVU59bQkt45WvcnJJctQojCqBeG2';

    it('it should succeed pre-claiming with V1 stubs', async function () {
      this.timeout(10000);
      const unclaimdForUrlV1 = sandbox.stub(ae.contractV1.methods, 'unclaimed_for_url').callsFake(async () => ({ decodedResult: 1 }));
      const checkClaimV1 = sandbox.stub(ae.contractV1.methods, 'check_claim').callsFake(async () => ({ decodedResult: { success: true } }));
      await ae.preClaim(address, url, new Trace(), ae.contractV1);
      unclaimdForUrlV1.called.should.equal(true);
      sinon.assert.alwaysCalledWith(unclaimdForUrlV1, url);
      checkClaimV1.called.should.equal(true);
      sinon.assert.alwaysCalledWith(checkClaimV1, url, address);
    });

    it('it should succeed pre-claiming with V1 + V2 stubs', async function () {
      this.timeout(10000);
      if (ae.contractV2) {
        const unclaimdForUrlV1 = sandbox.stub(ae.contractV1.methods, 'unclaimed_for_url').callsFake(async () => ({ decodedResult: 1 }));
        const unclaimdForUrlV2 = sandbox.stub(ae.contractV2.methods, 'unclaimed_for_url').callsFake(async () => ({ decodedResult: 1 }));
        const checkClaimV1 = sandbox.stub(ae.contractV1.methods, 'check_claim').callsFake(async () => ({ decodedResult: { success: true } }));
        const checkClaimV2 = sandbox.stub(ae.contractV2.methods, 'check_claim').callsFake(async () => ({ decodedResult: { success: true } }));
        await ae.preClaim(address, url, new Trace(), ae.contractV1);
        await ae.preClaim(address, url, new Trace(), ae.contractV2);
        unclaimdForUrlV1.called.should.equal(true);
        sinon.assert.alwaysCalledWith(unclaimdForUrlV1, url);
        unclaimdForUrlV2.called.should.equal(true);
        sinon.assert.alwaysCalledWith(unclaimdForUrlV2, url);
        checkClaimV1.called.should.equal(true);
        sinon.assert.alwaysCalledWith(checkClaimV1, url, address);
        checkClaimV2.called.should.equal(true);
        sinon.assert.alwaysCalledWith(checkClaimV2, url, address);
      } else {
        this.skip();
      }
    });

    it('it should allow to claim if all goes well (with stubs) for V1', async function () {
      this.timeout(10000);
      sandbox.stub(ae, 'preClaim').callsFake(async () => ({ decodedResult: true }));
      const claimV1 = sandbox.stub(ae.contractV1.methods, 'claim').callsFake(async () => ({ decodedResult: true }));
      const result = await ae.claimTips(address, url, new Trace());
      result.should.equal(true);
      claimV1.called.should.equal(true);
      sinon.assert.alwaysCalledWith(claimV1, url, address);
    });

    it('it should allow to claim if all goes well (with stubs) for V1 + V2', async function () {
      this.timeout(10000);
      if (ae.contractV2) {
        sandbox.stub(ae, 'preClaim').callsFake(async () => ({ decodedResult: true }));
        const claimV1 = sandbox.stub(ae.contractV1.methods, 'claim').callsFake(async () => ({ decodedResult: true }));
        const claimV2 = sandbox.stub(ae.contractV2.methods, 'claim').callsFake(async () => ({ decodedResult: true }));
        const result = await ae.claimTips(address, url, new Trace());
        result.should.equal(true);
        claimV1.called.should.equal(true);
        claimV2.called.should.equal(false); // no need to claim V2 if V1 is claimable
        sinon.assert.alwaysCalledWith(claimV1, url, address);
      } else {
        this.skip();
      }
    });
  });

  describe('Tokens', () => {
    let sandbox;
    let tokenContractAddress;
    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
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
});
