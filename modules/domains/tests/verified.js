import chaiHttp from "chai-http";
import server from "../../../server.js";
import CacheLogic from "../../cache/logic/cacheLogic.js";

const { describe, it } = mocha;
chai.should();
chai.use(chaiHttp);
// Our parent block
describe("Verified", () => {
  describe("Verified API", () => {
    it("it should GET all the verified entries", (done) => {
      const stub = jest.spyOn(CacheLogic, "getOracleAllClaimedUrls").mockClear().mockImplementation(() => ["https://www.test.domain.com"]);
      chai
        .request(server)
        .get("/verified/")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          res.body.should.have.length(1);
          res.body[0].should.equal("https://www.test.domain.com");
          stub.called.should.equal(true);
          stub.mockRestore();
          done();
        });
    });
  });
});
