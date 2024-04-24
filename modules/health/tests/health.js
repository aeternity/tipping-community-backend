import chai from "chai";
import chaiHttp from "chai-http";
import mocha from "mocha";
import sinon from "sinon";
import server from "../../../server.js";
import aeternity from "../../aeternity/logic/aeternity.js";
import ipfs from "../../backup/logic/ipfsLogic.js";

const { describe, it } = mocha;
chai.should();
chai.use(chaiHttp);
describe("Health Endpoint", () => {
  describe("Backend Health", () => {
    before(() => {
      ipfs.init();
    });
    afterEach(() => {
      sinon.restore();
    });
    it("it should GET a health endpoint answer", (done) => {
      sinon.stub(aeternity, "getBalance").resolves("10");
      chai
        .request(server)
        .get("/health/backend")
        .end((err, res) => {
          res.body.should.be.a("object");
          res.body.should.have.property("dbHealth", true);
          res.body.should.have.property("ipfsHealth", true);
          res.body.should.have.property("redisHealth", true);
          res.body.should.have.property("aeHealth", true);
          res.body.should.have.property("allHealthy", true);
          res.should.have.status(200);
          done();
        });
    });
  });
});
