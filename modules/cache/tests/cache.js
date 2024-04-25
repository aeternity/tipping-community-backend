import chaiHttp from "chai-http";
import server from "../../../server.js";
import cache from "../utils/cache.js";
import CacheLogic from "../logic/cacheLogic.js";
import aeternity from "../../aeternity/logic/aeternity.js";
import { MESSAGES, MESSAGE_QUEUES } from "../../queue/constants/queue.js";
import queueLogic from "../../queue/logic/queueLogic.js";
import models from "../../../models/index.js";

const { describe, it, before } = mocha;
const { Event } = models;
chai.should();
chai.use(chaiHttp);
// Our parent block
describe("Cache", () => {
  before(async () => {
    this.timeout(20000);
    await cache.del(["fetchPrice"]);
    await cache.del(["getChainNames"]);
    await cache.delByPrefix(["getOracleClaimedUrls"]);
    await cache.del(["getOracleAllClaimedUrls"]);
    await cache.del(["contractEvents"]);
    await cache.del(["CacheLogic.getAllTips", "all"]);
    await cache.del(["CacheLogic.getAllTips", "blacklisted"]);
    await aeternity.init();
  });
  const checkCachedRoute = (route, type, done) => {
    chai
      .request(server)
      .get(route)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a(type);
        done();
      });
  };
  const minimalTimeout = 200;
  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe("Keep Hot", () => {
    it("should update the cache (keep hot simulation)", (done) => {
      const keepHotStub = jest.spyOn(CacheLogic, "keepHotFunction").mockClear().mockImplementation(async () => {
        expect(keepHotStub).toHaveBeenCalledTimes(1);
        done();
      });
      CacheLogic.init();
      queueLogic.sendMessage(MESSAGE_QUEUES.SCHEDULED_EVENTS, MESSAGES.SCHEDULED_EVENTS.COMMANDS.CACHE_KEEPHOT);
    });
  });
  describe("API", () => {
    it("it should GET all chainnames ", async () => {
      this.timeout(5000);
      await cache.del(["fetchMdwChainNames"]);
      await cache.del(["fetchChainNames"]);
      const res = await chai.request(server).get("/cache/chainnames");
      res.should.have.status(200);
      res.body.should.be.a("object");
      const addresses = Object.keys(res.body);
      const chainNames = Object.values(res.body);
      addresses.every((address) => address.indexOf("ak_") === 0).should.eql(true);
      chainNames.every((chainName) => chainName.indexOf(".chain") > -1).should.eql(true);
    });
    it(`it should GET all chainnames cache items in less than ${minimalTimeout}ms`, done => {
      this.timeout(minimalTimeout);
      checkCachedRoute("/cache/chainnames", "object", done);
    });
    it("it should GET the cached price", done => {
      this.timeout(10000);
      checkCachedRoute("/cache/price", "object", done);
    });
    it(`it should GET the cached price in less than ${minimalTimeout}ms`, done => {
      this.timeout(minimalTimeout);
      checkCachedRoute("/cache/price", "object", done);
    });
    it("it should GET all cached events", async () => {
      await Event.destroy({
        where: {},
        truncate: true,
      });
      const sampleEvent = {
        name: "TipWithdrawn",
        hash: "th_1",
        contract: "ct_1",
        height: 0,
        addresses: ["ak_in", "ak_in_2"],
        url: "example.com",
        amount: "1000",
        nonce: 1,
        time: 1000,
        data: {},
      };
      await Event.bulkCreate([sampleEvent, sampleEvent, { ...sampleEvent, addresses: ["ak_out"] }]);
      const res = await chai.request(server).get("/cache/events");
      res.should.have.status(200);
      res.body.should.be.an("array");
      res.body.should.have.length(3);
      const resAddress = await chai.request(server).get("/cache/events?address=ak_in");
      resAddress.should.have.status(200);
      resAddress.body.should.be.an("array");
      resAddress.body.should.have.length(2);
      const resFakeAddress = await chai.request(server).get("/cache/events?address=ak_not_in_there");
      resFakeAddress.should.have.status(200);
      resFakeAddress.body.should.be.an("array");
      resFakeAddress.body.should.have.length(0);
      const resLimit = await chai.request(server).get("/cache/events?limit=1");
      resLimit.should.have.status(200);
      resLimit.body.should.be.an("array");
      resLimit.body.should.have.length(1);
      const resEventFilter = await chai.request(server).get("/cache/events?event=TipWithdrawn");
      resEventFilter.should.have.status(200);
      resEventFilter.body.should.be.an("array");
      resEventFilter.body.should.have.length(3);
      const resEventEmpty = await chai.request(server).get("/cache/events?event=TipReceived");
      resEventEmpty.should.have.status(200);
      resEventEmpty.body.should.be.an("array");
      resEventEmpty.body.should.have.length(0);
    });
    it(`it should GET all cached events in less than ${minimalTimeout}ms`, done => {
      this.timeout(minimalTimeout);
      checkCachedRoute("/cache/events", "array", done);
    });
    it("it should invalidate the tips cache", (done) => {
      checkCachedRoute("/cache/invalidate/tips", "object", done);
    });
    it("it should invalidate the oracle cache", (done) => {
      checkCachedRoute("/cache/invalidate/oracle", "object", done);
    });
    it("it should invalidate the events cache", (done) => {
      checkCachedRoute("/cache/invalidate/events", "object", done);
    });
    it("it should invalidate the token cache", done => {
      this.timeout(5000);
      // Just a random token contract, can be replaced anytime if its not working anymore
      const tokenAddress = "ct_MRgnq6YXCi4Bd6CCks1bu8rTUfFmgLEAWWXVi7hSsJA4LZejs";
      checkCachedRoute(`/cache/invalidate/token/${tokenAddress}`, "object", done);
    });
  });
  describe("WordBazaar", () => {
    it("it should invalidate a wordSale cache", done => {
      this.timeout(25000);
      // Just a random token contract, can be replaced anytime if its not working anymore
      const wordSaleCtAddress = "ct_RJt3nE2xwpA1Y95pkwyH7M5VthQUBd2TcdxuDZguGatQzKrWM";
      checkCachedRoute(`/cache/invalidate/wordSale/${wordSaleCtAddress}`, "object", done);
    });
    it("it should invalidate the wordRegistry cache", done => {
      this.timeout(25000);
      checkCachedRoute("/cache/invalidate/wordRegistry", "object", done);
    });
    it("it should invalidate a wordSalesVote cache", done => {
      this.timeout(25000);
      // Just a random token contract, can be replaced anytime if its not working anymore
      const wordSaleCtAddress = "ct_RJt3nE2xwpA1Y95pkwyH7M5VthQUBd2TcdxuDZguGatQzKrWM";
      checkCachedRoute(`/cache/invalidate/wordSaleVotes/${wordSaleCtAddress}`, "object", done);
    });
    it("it should invalidate a wordSaleVoteState cache", done => {
      this.timeout(25000);
      // Just a random token contract, can be replaced anytime if its not working anymore
      const wordSaleCtAddress = "ct_RJt3nE2xwpA1Y95pkwyH7M5VthQUBd2TcdxuDZguGatQzKrWM";
      checkCachedRoute(`/cache/invalidate/wordSaleVoteState/${wordSaleCtAddress}`, "object", done);
    });
  });
});
