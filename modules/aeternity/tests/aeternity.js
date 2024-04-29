import BigNumber from "bignumber.js";
import ae from "../logic/aeternity.js";
import Trace from "../../payfortx/logic/traceLogic.js";
import { afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals";

// Our parent block
describe("Aeternity", () => {
  describe("Init", () => {
    it("it should init", async () => {
      await ae.init();
    }, 20000);
    it("it should get the network id", async () => {
      const result = await ae.networkId();
      expect(result).toBe("ae_uat");
    });
  });
  describe("Oracle", () => {
    beforeAll(async () => {
      await ae.init();
    }, 20000);
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("it should get all oracle claimed urls", async () => {
      const result = await ae.getOracleAllClaimedUrls();
      expect(result).toBeInstanceOf(Array);
      expect(result).not.toHaveLength(0);
      expect(result).toContain("https://github.com/mradkov");
    }, 30000);
    it("it should get the oracle claim by url", async () => {
      const result = await ae.fetchOracleClaimByUrl("https://github.com/mradkov");
      result.should.be.an("object");
      result.should.have.property("success");
      result.should.have.property("percentage");
      result.should.have.property("account");
    }, 30000);
    it("it should get the oracle claim by address", async () => {
      const result = await ae.fetchOracleClaimedUrls("ak_YCwfWaW5ER6cRsG9Jg4KMyVU59bQkt45WvcnJJctQojCqBeG2");
      result.should.be.an("array");
      result.should.include("https://github.com/mradkov");
    }, 30000);
  });
  describe("Claiming", () => {
    const url = "https://probably.not.an.existing.tip";
    const address = "ak_YCwfWaW5ER6cRsG9Jg4KMyVU59bQkt45WvcnJJctQojCqBeG2";

    beforeAll(async () => {
      await ae.init();
    }, 20000);
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("it should get the tips, retips & claims", async () => {
      const result = await ae.fetchStateBasic();
      expect(result).toHaveProperty("tips");
      expect(result).toHaveProperty("retips");
      expect(result).toHaveProperty("claims");
      const [firstTip] = result.tips;
      expect(firstTip).toMatchObject(
        expect.objectContaining({
          amount: expect.any(String),
          sender: expect.any(String),
          timestamp: expect.any(Number),
          title: expect.any(String),
          type: expect.any(String),
          claimGen: expect.any(Number),
          id: expect.any(String),
          contractId: expect.any(String),
          url: expect.any(String),
          urlId: expect.any(String),
          topics: expect.any(Array),
          token: expect.any(String),
          tokenAmount: expect.any(String),
        }),
      );

      const [firstRetip] = result.retips;
      expect(firstRetip).toMatchObject(
        expect.objectContaining({
          amount: expect.any(String),
          sender: expect.any(String),
          tipId: expect.any(String),
          id: expect.any(String),
          contractId: expect.any(String),
          claimGen: expect.any(Number),
          token: expect.any(String),
          tokenAmount: expect.any(String),
        }),
      );

      const [firstClaim] = result.claims;
      expect(firstClaim).toMatchObject(
        expect.objectContaining({
          contractId: expect.any(String),
          url: expect.any(String),
          claimGen: expect.any(Number),
          amount: expect.any(String),
        }),
      );
    }, 20000);
    it("it should fail pre-claiming an non existing tip", async () => {
      // CHECK V2
      const resultV2 = await ae.getTotalClaimableAmount("https://probably.not.an.existing.tip", new Trace());
      expect(resultV2).toStrictEqual(new BigNumber("0"));
    }, 10000);

    it("it should succeed claiming with V1 stubs", async () => {
      const stubClaimAmount = jest.spyOn(ae, "getClaimableAmount").mockResolvedValue(new BigNumber("1"));
      const stubCheckClaim = jest.spyOn(ae, "checkClaimOnContract").mockResolvedValue(true);
      const stubClaim = jest.spyOn(ae, "claimOnContract").mockResolvedValue(true);
      const trace = new Trace();
      await ae.claimTips(address, url, trace);
      expect(stubClaimAmount).toHaveBeenCalled();
      expect(stubClaimAmount.mock.calls[0][0]).toBe(url);
      expect(stubClaimAmount.mock.calls[0][1]).toBe(trace);
      expect(stubCheckClaim).toHaveBeenCalled();
      expect(stubCheckClaim.mock.calls[0][0]).toBe(address);
      expect(stubCheckClaim.mock.calls[0][1]).toBe(url);
      expect(stubCheckClaim.mock.calls[0][2]).toBe(trace);
      expect(stubClaim).toHaveBeenCalled();
      expect(stubClaim.mock.calls[0][0]).toBe(address);
      expect(stubClaim.mock.calls[0][1]).toBe(url);
      expect(stubClaim.mock.calls[0][2]).toBe(trace);
    }, 10000);
    it("it should succeed claiming with V1 + V2 stubs", async () => {
      const stubClaimAmount = jest.spyOn(ae, "getClaimableAmount").mockImplementation(() => {
        if (stubClaimAmount.mock.calls.length === 0) {
          return new BigNumber("0");
        }
        if (stubClaimAmount.mock.calls.length === 1) {
          return new BigNumber("1");
        }
      });
      const stubCheckClaim = jest.spyOn(ae, "checkClaimOnContract").mockResolvedValue(true);
      const stubClaim = jest.spyOn(ae, "claimOnContract").mockResolvedValue(true);
      const trace = new Trace();
      await ae.claimTips(address, url, trace);
      expect(stubClaimAmount).toHaveBeenCalledTimes(2);
      expect(stubClaimAmount.mock.calls[0][0]).toBe(url);
      expect(stubClaimAmount.mock.calls[0][1]).toBe(trace);
      expect(stubCheckClaim).toHaveBeenCalledTimes(1);
      expect(stubCheckClaim.mock.calls[0][0]).toBe(address);
      expect(stubCheckClaim.mock.calls[0][1]).toBe(url);
      expect(stubCheckClaim.mock.calls[0][2]).toBe(trace);
      expect(stubClaim).toHaveBeenCalledTimes(1);
      expect(stubClaim.mock.calls[0][0]).toBe(address);
      expect(stubClaim.mock.calls[0][1]).toBe(url);
      expect(stubClaim.mock.calls[0][2]).toBe(trace);
    }, 10000);
  });
  describe("Tokens", () => {
    let tokenContractAddress;
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("it should get the token registry state", async () => {
      const result = await ae.fetchTokenRegistryState();
      result.should.be.an("array");
      const [firstEntry] = result;
      firstEntry.should.be.an("array");
      // token contract address
      firstEntry[0].should.be.an("string");
      firstEntry[0].should.contain("ct_");
      // token contract meta infos
      firstEntry[1].should.be.an("object");
      firstEntry[1].should.have.property("decimals");
      firstEntry[1].should.have.property("name");
      firstEntry[1].should.have.property("symbol");
      [tokenContractAddress] = firstEntry;
    }, 10000);
    it("it should get the token meta info from a contract", async () => {
      const result = await ae.fetchTokenMetaInfo(tokenContractAddress);
      result.should.be.an("object");
      result.should.have.property("decimals");
      result.should.have.property("name");
      result.should.have.property("symbol");
    }, 10000);
    it("it should get the account balances from a contract", async () => {
      const result = await ae.fetchTokenAccountBalances(tokenContractAddress);
      result.should.be.an("array");
      if (result.length !== 0) {
        const [[address, balance]] = result;
        address.should.be.an("string");
        address.should.contain("ak_");
        if (balance === 0) {
          balance.should.be.an("number");
        } else {
          balance.should.be.an("string");
          const intBalance = parseInt(balance, 10);
          intBalance.should.be.greaterThan(0);
        }
      }
    }, 10000);
  });
  describe("Resilience", () => {
    beforeAll(async () => {
      await ae.init();
    }, 10000);
    it("should crash for a non responding node on startup", async () => {
      const originalUrl = process.env.NODE_URL;
      process.env.NODE_URL = "https://localhost";
      await expect(ae.resetClient()).rejects.toContain("ECONNREFUSED");
      process.env.NODE_URL = originalUrl;
    }, 10000);
    afterAll(async () => {
      await ae.resetClient();
    }, 10000);
  });
});
