const { Router } = require('express');
const TokenCacheLogic = require('../logic/tokenCacheLogic');
const CacheLogic = require('../../cache/logic/cacheLogic');

const router = new Router();

const wordbazaarMiddleware = (req, res, next) => {
  if (process.env.WORD_REGISTRY_CONTRACT) return next();
  return res.status(403).send('NotImplemented');
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
router.get('/tokenInfo', TokenCacheLogic.deliverTokenInfo);

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
router.post('/addToken', TokenCacheLogic.indexTokenInfo);

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
router.get('/balances', TokenCacheLogic.tokenAccountBalance);

/**
 * @swagger
 * /tokenCache/wordRegistry:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Get word registry overview
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/wordRegistry', wordbazaarMiddleware, async (req, res) => res.send(await CacheLogic.getWordRegistryData()));

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
router.get('/wordSale/:contractAddress', wordbazaarMiddleware,
  async (req, res) => res.send(await CacheLogic.wordSaleDetails(req.params.contractAddress)));

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
router.get('/wordSaleByToken/:contractAddress', wordbazaarMiddleware, async (req, res) => {
  const data = await CacheLogic.wordSaleDetailsByToken(req.params.contractAddress);
  if (!data) return res.status(404).send('no word sale information for address');
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
router.get('/wordSaleVotesDetails/:contractAddress', wordbazaarMiddleware,
  async (req, res) => res.send(await CacheLogic.wordSaleVotesDetails(req.params.contractAddress)));

module.exports = router;
