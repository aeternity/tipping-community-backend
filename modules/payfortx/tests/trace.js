import { should, use } from "chai";
import chaiHttp from "chai-http";
import fs from "fs";
import mocha from "mocha";
import sinon from "sinon";
import BigNumber from "bignumber.js";
import server from "../../../server.js";
import ae from "../../aeternity/logic/aeternity.js";
import models from "../../../models/index.js";
import { publicKey, getDBSeedFunction } from "../../../utils/testingUtil.js";
import EventLogic from "../../event/logic/eventLogic.js";

const { describe, it, before } = mocha;
const { Trace } = models;
should();
use(chaiHttp);
// Our parent block
describe("Trace", () => {
  before(async function () {
    this.timeout(10000);
    await Trace.truncate();
    await ae.init();
  });
  const seedDB = getDBSeedFunction([Trace]);
  describe("TraceLogic API Backend", () => {
    it("it should GET zero traces for non existing tip id", (done) => {
      chai
        .request(server)
        .get("/tracing/backend?id=0")
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
    it("it should GET zero traces for an existing tip with no traces", async () => {
      await seedDB({
        tips: [
          {
            id: "1_v1",
          },
        ],
      });
      const res = await chai.request(server).get("/tracing/backend?id=1_v1");
      res.should.have.status(200);
      res.body.should.be.a("array");
      res.body.length.should.be.eql(0);
    });
    it("malformed request without url should not leave a trace", (done) => {
      chai
        .request(server)
        .post("/claim/submit")
        .send({
          address: "ak_25tyimcbt8W5BHauzazQKnb6oM1AbkPBYFu6fnSvp38kVrtr8t", // RANDOM PK
        })
        .end((err, res) => {
          res.should.have.status(400);
          Trace.findAll({ raw: true }).then((results) => {
            results.should.have.length(0);
            done();
          });
        });
    });
    it("malformed request with claimamount 0 should not leave a trace", function (done) {
      this.timeout(10000);
      chai
        .request(server)
        .post("/claim/submit")
        .send({
          address: publicKey,
          url: "https://this.is.a.fake.url", // Random URL
        })
        .end((err, res) => {
          res.should.have.status(400);
          Trace.findAll({ raw: true }).then((results) => {
            results.should.have.length(0);
            done();
          });
        });
    });
    it("proper request should leave a trace", (done) => {
      const stub = sinon.stub(ae, "getTotalClaimableAmount").callsFake(async () => new BigNumber(10));
      chai
        .request(server)
        .post("/claim/submit")
        .send({
          address: publicKey,
          url: "example.com",
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("claimUUID");
          fs.existsSync(`./traces/${res.body.claimUUID}.json`).should.equal(true);
          stub.restore();
          done();
        });
    });
    it("it should GET all traces for a proper tip", async () => {
      await seedDB(
        {
          tips: [
            {
              id: "462_v1",
              url: "example.com",
            },
          ],
        },
        false,
      );
      const res = await chai.request(server).get("/tracing/backend?id=462_v1"); // 462_v1 == example.com
      res.should.have.status(200);
      res.body.should.be.a("array");
      res.body.length.should.be.eql(1);
    });
    it("it should GET all blockchain traces for a proper tip", async function () {
      this.timeout(10000);
      await seedDB(
        {
          tips: [
            {
              id: "462_v1",
              url: "example.com",
            },
          ],
        },
        false,
      );
      sinon.stub(EventLogic, "getEventsForURL").callsFake(async () => [
        {
          event: "TipReceived",
          url: "example.com",
        },
        {
          event: "TipReceived",
          url: "example.com",
        },
      ]);
      sinon.stub(ae, "fetchOracleClaimByUrl").callsFake(async () => null);
      const res = await chai.request(server).get("/tracing/blockchain?id=462_v1"); // 462_v1 == example.com
      res.should.have.status(200);
      res.body.should.be.a("object");
      res.body.should.have.property("tip");
      res.body.should.have.property("urlStats");
      res.body.urlStats.should.eql({
        retipsLength: "0",
        senders: [],
        sendersLength: "0",
        tipsLength: "1",
        totalAmount: "1",
        totalClaimedAmount: "1",
        totalTipsLength: "1",
        totalTokenAmount: [],
        totalTokenClaimedAmount: [],
        totalTokenUnclaimedAmount: [],
        totalUnclaimedAmount: "0",
        url: "example.com",
      });
      res.body.tip.should.have.property("aggregation");
      res.body.tip.aggregation.should.eql({
        id: "462_v1",
        totalAmount: "1",
        totalClaimedAmount: "1",
        totalTokenAmount: [],
        totalTokenClaimedAmount: [],
        totalTokenUnclaimedAmount: [],
        totalUnclaimedAmount: "0",
      });
      res.body.should.have.property("urlEvents");
      res.body.urlEvents.should.eql([
        {
          event: "TipReceived",
          url: "example.com",
        },
        {
          event: "TipReceived",
          url: "example.com",
        },
      ]);
    });
  });
});
