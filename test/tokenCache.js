const chai = require('chai');
const chaiHttp = require('chai-http');
const {
  describe, it, before,
} = require('mocha');
const sinon = require('sinon');
const server = require('../server');
const aeternity = require('../utils/aeternity');
const CacheLogic = require('../logic/cacheLogic');
const TokenCacheLogic = require('../logic/tokenCacheLogic');

chai.should();
chai.use(chaiHttp);
chai.use(chaiHttp);

describe('Token Cache', () => {
  describe('API', () => {
    before(async () => {
      await aeternity.init();
    });

    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    // TODO create a way better test coverage

    it('it should GET token info', async () => {
      sandbox.stub(CacheLogic, 'getTips').callsFake(async () => ([]));
      chai.request(server).get('/tokenCache/tokenInfo').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('ct_2DQ1vdJdiaNVgh2vUbTTpkPRiT9e2GSx1NxyU7JM9avWqj6dVf');
        res.body.ct_2DQ1vdJdiaNVgh2vUbTTpkPRiT9e2GSx1NxyU7JM9avWqj6dVf.should.be.deep.equal({
          decimals: 18,
          name: 'SOFIA',
          symbol: 'SOF',
        });
      });
    });

    it('it should ADD a token to be indexed', done => {
      chai.request(server).post('/tokenCache/addToken')
        .send({ address: 'ct_2DQ1vdJdiaNVgh2vUbTTpkPRiT9e2GSx1NxyU7JM9avWqj6dVf' }).end((err, res) => {
          res.should.have.status(200);
          res.text.should.be.equal('OK');
          done();
        });
    });

    it('it shouldnt GET token info without address', done => {
      chai.request(server).get('/tokenCache/balances').end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });

    it('it should GET token balances for address', done => {
      chai.request(server).get('/tokenCache/balances?address=ak_2VnwoJPQgrXvreUx2L9BVvd9BidWwpu1ASKK1AMre21soEgpRT').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('ct_MRgnq6YXCi4Bd6CCks1bu8rTUfFmgLEAWWXVi7hSsJA4LZejs');
        res.body.ct_MRgnq6YXCi4Bd6CCks1bu8rTUfFmgLEAWWXVi7hSsJA4LZejs.should.be.deep.equal({
          decimals: 0,
          name: 'Other Test Token',
          symbol: 'OT',
        });
        done();
      });
    });
  });
});
