const chai = require('chai');
const { describe, it, afterEach } = require('mocha');
const sinon = require('sinon');

const cache = require('../utils/cache');
const CacheLogic = require('../logic/cacheLogic');
const MdwLogic = require('../../aeternity/logic/mdwLogic');

chai.should();

describe('Chain names cache lock', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should wait for the running fetch instead of timing out the lock', async () => {
    const getOrSet = sinon.spy(cache, 'getOrSet');
    sinon.stub(MdwLogic, 'getChainNames').resolves({});
    await cache.del(['fetchMdwChainNames']);

    await CacheLogic.fetchMdwChainNames();

    getOrSet.calledOnce.should.eql(true);
    getOrSet.firstCall.args[3].should.eql(false);
  });

  it('should fetch the chain names only once for concurrent requests', async () => {
    const getChainNames = sinon.stub(MdwLogic, 'getChainNames')
      .callsFake(() => new Promise(resolve => { setTimeout(() => resolve({ ak_test: ['test.chain'] }), 200); }));
    await cache.del(['fetchMdwChainNames']);

    const results = await Promise.all([1, 2, 3, 4, 5].map(() => CacheLogic.fetchMdwChainNames()));

    getChainNames.calledOnce.should.eql(true);
    results.forEach(result => result.should.eql({ ak_test: ['test.chain'] }));
  });
});
