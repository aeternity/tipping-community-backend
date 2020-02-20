//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
let should = chai.should();

const Crypto = require('@aeternity/aepp-sdk').Crypto;
const { secretKey, publicKey } = Crypto.generateKeyPair();
//During the test the env variable is set to test
process.env = {
  ...process.env,
  NODE_URL: 'https://mainnet.aeternal.io',
  COMPILER_URL: 'https://compiler.aepps.com',
  CONTRACT_ADDRESS: 'ct_YpQpntd6fi6r3VXnGW7vJiwPYtiKvutUDY35L4PiqkbKEVRqj',
  CONTRACT_FILE: 'TippingCorona',
  NODE_ENV: 'test',
  PRIVATE_KEY: secretKey,
  PUBLIC_KEY: publicKey,
};

// Imports to load data
const server = require('../server.js');

chai.use(chaiHttp);
//Our parent block
describe('Pay for TX', () => {

  describe('Flat API Tests', () => {
    it('it should fail without body', (done) => {
      chai.request(server).post('/claim/submit').send({}).end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });

    it('it should fail without address', (done) => {
      chai.request(server).post('/claim/submit').send({
        url: 'https://aeternity.com',
      }).end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });

    it('it should fail without url', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
      }).end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });
  });

  describe('Dynamic website', () => {

    before(async function () {
      this.timeout(25000);
      const ae = require('../utils/aeternity.js');
      await ae.init();
    });

    it('it should reject on website with no key', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
        url: 'https://github.com',
      }).end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property('error', 'Could not find any address in website');
        done();
      });
    }).timeout(10000);

    it('it should reject on website with no tips', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
        url: 'https://pastebin.com/raw/LKB1peSL', // ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk
      }).end((err, res) => {
        res.should.have.status(500);
        res.body.should.have.property('error', 'No tips for url');
        done();
      });
    }).timeout(10000);

    it('it should reject on website with wrong address', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: 'ak_3478952875bl34t32u4zgtr8734t394ght',
        url: 'https://pastebin.com/raw/LKB1peSL', // ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk
      }).end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property('error', 'found address does not match requested address');
        done();
      });
    }).timeout(10000);

    it('it should work with .chain names', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
        url: 'https://pastebin.com/raw/5ze13WAf', // reallylongtestname.chain
      }).end((err, res) => {
        res.should.have.status(500);
        res.body.should.have.property('error', 'No tips for url');
        done();
      });
    }).timeout(10000);

    it('it should give appropriate errors with not claimed .chain names', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
        url: 'https://pastebin.com/raw/izZDAzFi', // reallylongtestname.chain
      }).end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property('error', 'Could not find any address in website');
        done();
      });
    }).timeout(10000);


    it('weibo should work', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
        url: 'https://www.weibo.com/ttarticle/p/show?id=2309404468657932599325',
      }).end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property('error', 'found address does not match requested address');
        done();
      });
    }).timeout(60 * 1000);

    it('zhihu should work', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
        url: 'https://zhuanlan.zhihu.com/p/95577199',
      }).end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property('error', 'found address does not match requested address');
        done();
      });
    }).timeout(60 * 1000);

    it('forum.aeternity.com should work', (done) => {
      chai.request(server).post('/claim/submit').send({
        address: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
        url: 'https://forum.aeternity.com/t/corona-wallet-test/6152',
      }).end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property('error', 'found address does not match requested address');
        done();
      });
    }).timeout(60 * 1000);

    // TODO add test for successful tip claims
  });

  describe('Address retrieval', () => {

    before(async function () {
      this.timeout(25000);
      const ae = require('../utils/aeternity.js');
      await ae.init();
    });

    it('it should reject on website with no key', (done) => {
      chai.request(server).post('/claim/addresses').send({
        url: 'https://github.com',
      }).end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property('error', 'Could not find any addresses in website');
        done();
      });
    }).timeout(10000);

    it('it get address from website', (done) => {
      chai.request(server).post('/claim/addresses').send({
        url: 'https://pastebin.com/raw/LKB1peSL', // ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk
      }).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('addresses');
        const address = res.body.addresses;
        address.should.be.an('array');
        address.should.have.length(1);
        const firstResult = address[0];
        firstResult.should.eql('ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk');
        done();
      });
    }).timeout(10000);

    it('it should work with .chain names', (done) => {
      chai.request(server).post('/claim/addresses').send({
        url: 'https://pastebin.com/raw/5ze13WAf', // reallylongtestname.chain
      }).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('addresses');
        const address = res.body.addresses;
        address.should.be.an('array');
        address.should.have.length(1);
        const firstResult = address[0];
        firstResult.should.eql('ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk');
        done();
      });
    }).timeout(10000);

  });

  describe('Logger tests', () => {
    it('should return json parsable logs on endpoint', (done) => {
      chai.request(server).get('/logs/all')
        .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });
  });

});
