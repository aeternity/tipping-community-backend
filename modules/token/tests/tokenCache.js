const chai = require('chai');
const chaiHttp = require('chai-http');
const {
  describe, it, before,
} = require('mocha');
const sinon = require('sinon');
const server = require('../../../server');
const aeternity = require('../../aeternity/logic/aeternity');
const CacheLogic = require('../../cache/logic/cacheLogic');
const cache = require('../../cache/utils/cache');
const { publicKey } = require('../../../utils/testingUtil');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe('Token Cache', () => {
  before(async function () {
    this.timeout(10000);
    await aeternity.init();
  });
  describe('aex9Token', () => {
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    // TODO create a way better test coverage

    it('it should GET token info', async () => {
      const contractAddress = 'ct_contract';
      const tokenMetaInfoStub = sandbox.stub(aeternity, 'fetchTokenMetaInfo').callsFake(async () => ({
        decimals: 18,
        name: 'SOFIA',
        symbol: 'SOF',
      }));
      sandbox.stub(CacheLogic, 'getTokenRegistryState').callsFake(async () => [
        [contractAddress],
      ]);
      sandbox.stub(CacheLogic, 'getTips').callsFake(async () => []);

      // stub this to avoid errors because ct_contract is not a valid address
      const getTokenAccountsStub = sandbox.stub(CacheLogic, 'getTokenAccounts').callsFake(async () => {});
      sandbox.stub(aeternity, 'addTokenToRegistry').callsFake(async () => {});

      // Flush cache to force re-generation
      cache.del(['getTokenInfos']);
      cache.del(['getTokenMetaInfo', contractAddress]);
      const res = await chai.request(server).get('/tokenCache/tokenInfo');
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property(contractAddress);
      res.body[contractAddress].should.be.deep.equal({
        decimals: 18,
        name: 'SOFIA',
        symbol: 'SOF',
      });

      // Check sideffects
      sinon.assert.calledWith(getTokenAccountsStub, contractAddress);
      sinon.assert.calledWith(tokenMetaInfoStub, contractAddress);

      // Flush dirty cache
      cache.del(['getTokenInfos']);
    });

    it('it should ADD a token to be indexed', async () => {
      const contractAddress = 'ct_2bCbmU7vtsysL4JiUdUZjJJ98LLbJWG1fRtVApBvqSFEM59D6W';
      const registryStub = sandbox.stub(CacheLogic, 'getTokenRegistryState').callsFake(async () => []);
      const getTokenInfosStub = sandbox.stub(CacheLogic, 'getTokenInfos').callsFake(async () => []);
      const addTokenStub = sandbox.stub(aeternity, 'addTokenToRegistry').callsFake(async () => true);
      sandbox.stub(aeternity, 'fetchTokenMetaInfo').callsFake(async () => ({
        decimals: 18,
        name: 'SOFIA',
        symbol: 'SOF',
      }));
      cache.del(['getTokenMetaInfo', contractAddress]);
      const res = await chai.request(server).post('/tokenCache/addToken')
        .send({ address: contractAddress });
      res.should.have.status(200);
      res.text.should.be.equal('OK');
      sinon.assert.alwaysCalledWith(addTokenStub, contractAddress);
      addTokenStub.callCount.should.eql(1);
      registryStub.callCount.should.eql(1);
      getTokenInfosStub.callCount.should.eql(1);
      // clear dirty cache
      cache.del(['getTokenMetaInfo', contractAddress]);
    });

    it('it shouldnt GET token info without address', done => {
      chai.request(server).get('/tokenCache/balances').end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });

    it('it should GET token balances for address', async () => {
      const contractAddress = 'ct_contract';
      const oldContractAddress = 'ct_contract_with_balance';
      const metaInfo = {
        decimals: 0,
        name: 'Other Test Token',
        symbol: 'OT',
      };

      sandbox.stub(CacheLogic, 'getTokenRegistryState').callsFake(async () => [[contractAddress], [oldContractAddress]]);
      sandbox.stub(aeternity, 'fetchTokenMetaInfo').callsFake(async () => metaInfo);
      const getTokenAccountsStub = sandbox.stub(CacheLogic, 'getTokenAccounts').callsFake(async () => []);
      const fetchTokenAccountBalancesStub = sandbox.stub(aeternity, 'fetchTokenAccountBalances').callsFake(async () => []);
      await cache.del(['getTokenMetaInfo', contractAddress]);
      await CacheLogic.triggerGetTokenContractIndex([{
        token: contractAddress,
      }]);

      // Check for balance generation
      sinon.assert.calledWith(getTokenAccountsStub, contractAddress);
      getTokenAccountsStub.restore();
      fetchTokenAccountBalancesStub.restore();

      // Enfore balance regeneration
      await cache.del(['getTokenAccounts', contractAddress]);
      // Seed cache with existing token
      await cache.set(['getTokenAccounts.fetchBalances', publicKey], [oldContractAddress]);
      // Simulate new token response
      sandbox.stub(aeternity, 'fetchTokenAccountBalances').callsFake(() => ([
        [publicKey, 1000],
      ]));
      // Trigger cache update
      await CacheLogic.getTokenAccounts(contractAddress);

      const res = await chai.request(server).get(`/tokenCache/balances?address=${publicKey}`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property(contractAddress);
      res.body[contractAddress].should.be.deep.equal(metaInfo);
      res.body.should.have.property(oldContractAddress);
      res.body[oldContractAddress].should.be.deep.equal(metaInfo);
    });
  });

  describe('wordbazaar', () => {
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('it should get the word registry overview', async () => {
      cache.del(['wordRegistryData']);
      const res = await chai.request(server).get('/tokenCache/wordRegistry');
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('owner', 'ak_2VnwoJPQgrXvreUx2L9BVvd9BidWwpu1ASKK1AMre21soEgpRT');
      res.body.should.have.property('tokens');
    });

    it('it should get a word registry contract overview', async function () {
      this.timeout(15000);
      const ctAddress = 'ct_RJt3nE2xwpA1Y95pkwyH7M5VthQUBd2TcdxuDZguGatQzKrWM';
      cache.del(['wordSaleState', ctAddress]);
      cache.del(['fungibleTokenTotalSupply', ctAddress]);
      cache.del(['wordSalePrice', ctAddress]);

      const res = await chai.request(server).get(`/tokenCache/wordSale/${ctAddress}`);
      res.should.have.status(200);
      res.body.should.be.a('object');

      res.body.should.have.property('wordSaleAddress', ctAddress);
      res.body.should.have.property('tokenAddress', 'ct_2CFSj7edTECkin7Lcf7AkVjn73gb3vC5oPQw34QyRkDuvnvuSW');
      res.body.should.have.property('totalSupply');
      res.body.should.have.property('buyPrice');
      res.body.should.have.property('sellPrice');
      res.body.should.have.property('spread');
      res.body.should.have.property('description', 'Join the grunge community');
    });

    it('it should get a word contract by token', async function () {
      this.timeout(10000);
      const wordCtAddress = 'ct_RJt3nE2xwpA1Y95pkwyH7M5VthQUBd2TcdxuDZguGatQzKrWM';
      const tokenCtAddress = 'ct_2CFSj7edTECkin7Lcf7AkVjn73gb3vC5oPQw34QyRkDuvnvuSW';
      sandbox.stub(aeternity, 'fetchWordRegistryData').callsFake(async () => ({
        owner: '',
        tokens: [['TEST', wordCtAddress]],
      }));
      cache.del(['wordRegistryData']);

      const res = await chai.request(server).get(`/tokenCache/wordSaleByToken/${tokenCtAddress}`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('wordSaleAddress', wordCtAddress);
      res.body.should.have.property('tokenAddress', tokenCtAddress);
      res.body.should.have.property('totalSupply');
      res.body.should.have.property('buyPrice');
      res.body.should.have.property('sellPrice');
      res.body.should.have.property('spread');
      res.body.should.have.property('description', 'Join the grunge community');
    });

    it('it should get a vote details from a word contract', async function () {
      this.timeout(10000);
      const wordCtAddress = 'ct_2tAB3fS34GphhDvUfrBETiK4A61PVMYuFoLJBsD2Br6F5jvEm9';

      const res = await chai.request(server).get(`/tokenCache/wordSaleVotesDetails/${wordCtAddress}`);
      res.should.have.status(200);
      res.body.should.be.a('array');
      res.body[0].should.be.deep.equal({
        id: 0,
        alreadyApplied: false,
        voteAddress: 'ct_2m9FMzEuxVZKjEdC44JRp8RjQgFobG3z7RCogGoBbTdUg6du5f',
        subject: {
          VotePayout: [
            'ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag',
          ],
        },
        timeouted: true,
        timeoutHeight: 359437,
        closeHeight: 359417,
        voteAccounts: [],
        isClosed: true,
        isSuccess: false,
        votePercent: 0,
        stakePercent: '0',
      });
    });
  });
});
