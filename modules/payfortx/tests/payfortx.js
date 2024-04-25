import chaiHttp from "chai-http";
import aeppSdk from "@aeternity/aepp-sdk";
import tippingContractUtil from "tipping-contract/util/tippingContractUtil.js";
import BigNumber from "bignumber.js";
import ae from "../../aeternity/logic/aeternity.js";
import server from "../../../server.js";
import Trace from "../logic/traceLogic.js";
import TipLogic from "../../tip/logic/tipLogic.js";
import { TRACE_STATES } from "../constants/traceStates.js";
import { publicKey, secretKey } from "../../../utils/testingUtil.js";

const { describe, it, before } = mocha;
const { Crypto } = aeppSdk;
chai.should();
chai.use(chaiHttp);
// Our parent block
describe("Pay for TX", () => {
  describe("Claiming", () => {
    describe("Flat API Tests", () => {
      it("it should fail without body", (done) => {
        chai
          .request(server)
          .post("/claim/submit")
          .send({})
          .end((err, res) => {
            res.should.have.status(400);
            done();
          });
      });
      it("it should fail without address", (done) => {
        chai
          .request(server)
          .post("/claim/submit")
          .send({
            url: "https://aeternity.com",
          })
          .end((err, res) => {
            res.should.have.status(400);
            done();
          });
      });
      it("it should fail without url", (done) => {
        chai
          .request(server)
          .post("/claim/submit")
          .send({
            address: publicKey,
          })
          .end((err, res) => {
            res.should.have.status(400);
            done();
          });
      });
    });
    describe("valid request", () => {
      before(async () => {
        this.timeout(25000);
        await ae.init();
      });
      it("it should reject on website not in contract with zero amount", async () => {
        this.timeout(10000);
        const res = await chai.request(server).post("/claim/submit").send({
          address: publicKey,
          url: "https://complicated.domain.test",
        });
        res.should.have.status(400);
        res.body.should.have.property("error", "No zero amount claims");
      });
      it("it should accept if pre-claim was successful", async () => {
        this.timeout(10000);
        const preClaimStub = jest.spyOn(ae, "getTotalClaimableAmount").mockClear().mockImplementation().resolves(new BigNumber(100000));
        const claimStub = jest.spyOn(ae, "claimTips").mockClear().mockImplementation().resolves(true);
        const res = await chai.request(server).post("/claim/submit").send({
          address: publicKey,
          url: "https://complicated.domain.test",
        });
        res.should.have.status(200);
        res.body.should.have.property("claimUUID");
        claimStub.called.should.equal(true);
        const trace = new Trace(res.body.claimUUID);
        const lastElement = trace.data[trace.data.length - 1];
        lastElement.should.have.property("result", "success");
        lastElement.should.have.property("state", TRACE_STATES.FINISHED);
        claimStub.mockRestore();
        preClaimStub.mockRestore();
      });
    });
  });
  describe("Post to V3", () => {
    before(async () => {
      this.timeout(25000);
      await ae.init();
    });
    afterAll(() => {
      jest.restoreAllMocks();
    });
    it("it should post a tip", async () => {
      this.timeout(20000);
      const testData = {
        author: publicKey,
        title: "A random post",
        media: ["https://complicated.domain.test"],
      };
      const message = tippingContractUtil.postWithoutTippingString(testData.title, testData.media);
      const hash = Crypto.hash(message);
      const signature = Crypto.signMessage(hash, Buffer.from(secretKey, "hex"));
      jest.spyOn(ae, "postTipToV3").mockClear().mockImplementation((title, media, author, passedSignature) => {
        title.should.equal(testData.title);
        media.should.deep.equal(testData.media);
        author.should.equal(publicKey);
        const verified = Crypto.verifyMessage(hash, passedSignature, Crypto.decodeBase58Check(publicKey.substr(3)));
        verified.should.equal(true);
        return { hash: "hash", decodedResult: "1" };
      });
      const awaitStub = jest.spyOn(TipLogic, "awaitTipsUpdated").mockClear().mockImplementation(async () => {});
      const res = await chai
        .request(server)
        .post("/payfortx/post")
        .send({
          author: publicKey,
          title: testData.title,
          signature: Buffer.from(signature).toString("hex"),
          media: testData.media,
        });
      res.should.have.status(200);
      res.body.should.deep.equal({ tx: { hash: "hash", decodedResult: "1" } });
      expect(awaitStub).toHaveBeenCalledWith("1_v3");
    });
  });
});
