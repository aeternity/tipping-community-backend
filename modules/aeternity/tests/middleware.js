// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const {
  describe, it,
} = require('mocha');
const sinon = require('sinon');
const axios = require('axios');

const mdwLogic = require('../logic/mdwLogic');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Middleware', () => {
  describe('Events', () => {
    it('it should get the contract events from height now', async () => {
      const getStub = sinon.stub(axios, 'get').callsFake(() => new Promise(resolve => setTimeout(() => resolve({
        data: {
          data: [{
            hash: 'th_FzSdUdPzCRDnZeMYkq1AXsH1C9QeZfjXRcXuvhizvWSd3jhRn',
            tx: {
              abi_version: 3, amount: 100000000000000000,
            },
            tx_index: 12127091,
          }, {
            hash: 'th_JHjHaKSnjvfoZnv2WPtkefDhGMYdE4xsYS2rB6toUerS79NsF',
            tx: {
              abi_version: 3, amount: 100000000000000000,
            },
          }],
        },
      }), 200)));
      const transactions = await mdwLogic.middlewareContractTransactions(20);
      sinon.assert.calledWith(getStub,
        `${process.env.MIDDLEWARE_URL}/txs/gen/0-0?contract=${process.env.CONTRACT_V1_ADDRESS}&type=contract_call&limit=100`);
      sinon.assert.calledWith(getStub,
        `${process.env.MIDDLEWARE_URL}/txs/gen/0-0?contract=${process.env.CONTRACT_V2_ADDRESS}&type=contract_call&limit=100`);
      sinon.assert.calledWith(getStub,
        `${process.env.MIDDLEWARE_URL}/txs/gen/0-0?contract=${process.env.CONTRACT_V3_ADDRESS}&type=contract_call&limit=100`);
      sinon.assert.calledWith(getStub,
        `${process.env.MIDDLEWARE_URL}/txs/backward?contract=${process.env.CONTRACT_V1_ADDRESS}&type=contract_call&limit=100`);
      sinon.assert.calledWith(getStub,
        `${process.env.MIDDLEWARE_URL}/txs/backward?contract=${process.env.CONTRACT_V2_ADDRESS}&type=contract_call&limit=100`);
      sinon.assert.calledWith(getStub,
        `${process.env.MIDDLEWARE_URL}/txs/backward?contract=${process.env.CONTRACT_V3_ADDRESS}&type=contract_call&limit=100`);
      transactions.should.be.an('array');
      getStub.restore();
    });

    it('it should return an empty array if the middleware is down', async () => {
      const originalUrl = process.env.MIDDLEWARE_URL;
      process.env.MIDDLEWARE_URL = 'https://localhost/';
      const transactions = await mdwLogic.middlewareContractTransactions();
      transactions.should.be.an('array');
      transactions.should.have.length(0);
      process.env.MIDDLEWARE_URL = originalUrl;
    });
  });

  describe('Names', () => {
    it('it should get the active chain names', async () => {
      const names = await mdwLogic.getChainNames();
      names.should.be.an('array');
      names.should.have.length.greaterThan(0);
    });

    it('it should return an empty array if the middleware is down', async () => {
      const originalUrl = process.env.MIDDLEWARE_URL;
      process.env.MIDDLEWARE_URL = 'https://localhost/';
      const transactions = await mdwLogic.getChainNames();
      transactions.should.be.an('array');
      transactions.should.have.length(0);
      process.env.MIDDLEWARE_URL = originalUrl;
    });
  });
});
