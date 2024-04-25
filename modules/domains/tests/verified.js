import { should, use } from "chai";
import chaiHttp from "chai-http";
import sinon from "sinon";
import mocha from "mocha";
import server from "../../../server.js";
import CacheLogic from "../../cache/logic/cacheLogic.js";

const { describe, it } = mocha;
should();
use(chaiHttp);
// Our parent block
describe("Verified", () => {
  describe("Verified API", () => {
    it("it should GET all the verified entries", (done) => {
      const stub = sinon.stub(CacheLogic, "getOracleAllClaimedUrls").callsFake(() => ["https://www.test.domain.com"]);
      chai
        .request(server)
        .get("/verified/")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          res.body.should.have.length(1);
          res.body[0].should.equal("https://www.test.domain.com");
          stub.called.should.equal(true);
          stub.restore();
          done();
        });
    });
  });
});
