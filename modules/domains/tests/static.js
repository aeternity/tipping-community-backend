import { should, use } from "chai";
import chaiHttp from "chai-http";
import mocha from "mocha";
import server from "../../../server.js";

const { describe, it } = mocha;
should();
use(chaiHttp);
// Our parent block
describe("Static Routes", () => {
  describe("GrayList", () => {
    it("it should GET the hardcoded graylist", (done) => {
      chai
        .request(server)
        .get("/static/wallet/graylist")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          res.body.includes("facebook.com").should.equal(true);
          done();
        });
    });
  });
});
