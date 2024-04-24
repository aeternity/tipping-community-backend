import chai from "chai";
import chaiHttp from "chai-http";
import mocha from "mocha";
import sinon from "sinon";
import axios from "axios";
import mdwLogic from "../logic/mdwLogic.js";

const { describe, it } = mocha;
chai.should();
chai.use(chaiHttp);
// Our parent block
describe("Middleware", () => {
  describe("Events", () => {
    it("it should get the contract events from height now", async () => {
      const getStub = sinon.stub(axios, "get").callsFake(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: {
                    data: [
                      {
                        hash: "th_FzSdUdPzCRDnZeMYkq1AXsH1C9QeZfjXRcXuvhizvWSd3jhRn",
                        tx: {
                          abi_version: 3,
                          amount: 100000000000000000,
                        },
                        tx_index: 12127091,
                      },
                      {
                        hash: "th_JHjHaKSnjvfoZnv2WPtkefDhGMYdE4xsYS2rB6toUerS79NsF",
                        tx: {
                          abi_version: 3,
                          amount: 100000000000000000,
                        },
                      },
                    ],
                  },
                }),
              200,
            ),
          ),
      );
      const transactions = await mdwLogic.middlewareContractTransactions(20, 0);
      sinon.assert.calledWith(getStub, `${process.env.MIDDLEWARE_URL}/v2/txs?scope=gen:20-0&contract=${process.env.CONTRACT_V1_ADDRESS}&type=contract_call&limit=100`);
      sinon.assert.calledWith(getStub, `${process.env.MIDDLEWARE_URL}/v2/txs?scope=gen:20-0&contract=${process.env.CONTRACT_V2_ADDRESS}&type=contract_call&limit=100`);
      sinon.assert.calledWith(getStub, `${process.env.MIDDLEWARE_URL}/v2/txs?scope=gen:20-0&contract=${process.env.CONTRACT_V3_ADDRESS}&type=contract_call&limit=100`);
      transactions.should.be.an("array");
      getStub.restore();
    });
    it("it should return an empty array if the middleware is down", async () => {
      const originalUrl = process.env.MIDDLEWARE_URL;
      process.env.MIDDLEWARE_URL = "https://localhost/";
      const transactions = await mdwLogic.middlewareContractTransactions(50, 0);
      transactions.should.be.an("array");
      transactions.should.have.length(0);
      process.env.MIDDLEWARE_URL = originalUrl;
    });
  });
  describe("Names", () => {
    it("it should get the active chain names", async () => {
      const names = await mdwLogic.getChainNames();
      names.should.be.an("object");
      Object.keys(names).should.have.length.greaterThan(0);
      const firstAccount = Object.keys(names)[0];
      firstAccount.should.include("ak_");
      names[firstAccount].should.be.an("array");
      names[firstAccount].should.have.length.greaterThan(0);
    });
    it("it should return an empty array if the middleware is down", async () => {
      const originalUrl = process.env.MIDDLEWARE_URL;
      process.env.MIDDLEWARE_URL = "https://localhost/";
      const names = await mdwLogic.getChainNames();
      names.should.be.an("object");
      Object.keys(names).should.have.length(0);
      process.env.MIDDLEWARE_URL = originalUrl;
    });
  });
});
