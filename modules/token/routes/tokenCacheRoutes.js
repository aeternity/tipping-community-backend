import express from "express";
import BigNumber from "bignumber.js";
import Fuse from "fuse.js";
import TokenCacheLogic from "../logic/tokenCacheLogic.js";
import CacheLogic from "../../cache/logic/cacheLogic.js";
import searchOptions from "../../cache/constants/searchOptions.js";

const { Router } = express;
const router = new Router();
const wordbazaarMiddleware = (req, res, next) => {
  if (process.env.WORD_REGISTRY_CONTRACT) return next();
  return res.status(403).send("NotImplemented");
};
/**
 * @swagger
 * tags:
 * - name: "tokencache"
 *   description: "Caching AEX-9 token meta information and balances"
 */
/**
 * @swagger
 * /tokenCache/tokenInfo:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Returns a list of all tokens
 *     responses:
 *       200:
 *         description: Returns a list of all tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/tokenInfo", TokenCacheLogic.deliverTokenInfo);
/**
 * @swagger
 * /tokenCache/addToken:
 *   post:
 *     tags:
 *       - tokencache
 *     summary: Add a token to be indexed
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/addToken", TokenCacheLogic.indexTokenInfo);
/**
 * @swagger
 * /tokenCache/balances:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Get token balances for an address
 *     parameters:
 *       - in: query
 *         required: true
 *         schema:
 *           type: string
 *         name: address
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/balances", TokenCacheLogic.tokenAccountBalance);
/**
 * @swagger
 * /tokenCache/wordRegistry:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Get word registry overview
 *     parameters:
 *       - in: query
 *         required: false
 *         schema:
 *           type: string
 *         name: ordering
 *       - in: query
 *         required: false
 *         schema:
 *           type: string
 *         name: direction
 *       - in: query
 *         required: false
 *         schema:
 *           type: string
 *         name: search
 *         allowReserved: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/wordRegistry", wordbazaarMiddleware, async (req, res) => {
  const limit = 30;
  const direction = req.query.direction || "desc";
  let words = await CacheLogic.getWordRegistryAndSaleData();
  if (req.query.ordering) {
    switch (req.query.ordering) {
      case "asset":
        words = direction === "desc" ? words.sort((a, b) => -a.word.localeCompare(b.word)) : words.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case "buyprice":
        words = direction === "desc" ? words.sort((a, b) => new BigNumber(b.buyPrice).comparedTo(a.buyPrice)) : words.sort((a, b) => new BigNumber(a.buyPrice).comparedTo(b.buyPrice));
        break;
      case "sellprice":
        words = direction === "desc" ? words.sort((a, b) => new BigNumber(b.sellPrice).comparedTo(a.sellPrice)) : words.sort((a, b) => new BigNumber(a.sellPrice).comparedTo(b.sellPrice));
        break;
      case "supply":
        words = direction === "desc" ? words.sort((a, b) => new BigNumber(b.totalSupply).comparedTo(a.totalSupply)) : words.sort((a, b) => new BigNumber(a.totalSupply).comparedTo(b.totalSupply));
        break;
      default:
    }
  }
  if (req.query.search) {
    words = new Fuse(words, searchOptions).search(req.query.search).map((result) => {
      const { item } = result;
      item.searchScore = result.score;
      return item;
    });
  }
  if (req.query.page) {
    words = words.slice((req.query.page - 1) * limit, req.query.page * limit);
  }
  return res.send(words);
});
/**
 * @swagger
 * /tokenCache/wordSale/{contractAddress}:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Get word sale details for address
 *     parameters:
 *       - in: path
 *         required: true
 *         schema:
 *           type: string
 *         name: contractAddress
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/wordSale/:contractAddress", wordbazaarMiddleware, async (req, res) => res.send(await CacheLogic.getWordSaleDetails(req.params.contractAddress)));
/**
 * @swagger
 * /tokenCache/priceHistory/{contractAddress}:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Get word sale price history events for address
 *     parameters:
 *       - in: path
 *         required: true
 *         schema:
 *           type: string
 *         name: contractAddress
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/priceHistory/:contractAddress", wordbazaarMiddleware, async (req, res) => res.send(await CacheLogic.wordPriceHistory(req.params.contractAddress)));
/**
 * @swagger
 * /tokenCache/wordSaleByToken/{contractAddress}:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Get word sale details for token address
 *     parameters:
 *       - in: path
 *         required: true
 *         schema:
 *           type: string
 *         name: contractAddress
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/wordSaleByToken/:contractAddress", wordbazaarMiddleware, async (req, res) => {
  const data = await CacheLogic.wordSaleDetailsByToken(req.params.contractAddress);
  if (!data) return res.status(404).send("no word sale information for address");
  return res.send(data);
});
/**
 * @swagger
 * /tokenCache/wordSaleVotesDetails/{contractAddress}:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Get word sale vote details for address
 *     parameters:
 *       - in: path
 *         required: true
 *         schema:
 *           type: string
 *         name: contractAddress
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/wordSaleVotesDetails/:contractAddress", wordbazaarMiddleware, async (req, res) => res.send(await CacheLogic.wordSaleVotesDetails(req.params.contractAddress)));
export default router;
