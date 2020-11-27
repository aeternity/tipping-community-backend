const { Router } = require('express');
const TokenCacheLogic = require('../logic/tokenCacheLogic');

const router = new Router();

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
router.get('/wordRegistry', TokenCacheLogic.wordRegistry);

/**
 * @swagger
 * /tokenCache/wordSale:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Get word sale details for address
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
router.get('/wordSale', TokenCacheLogic.wordSaleDetails);

/**
 * @swagger
 * /tokenCache/wordSaleByToken:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Get word sale details for token address
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
router.get('/wordSaleByToken', TokenCacheLogic.wordSaleDetailsByToken);

/**
 * @swagger
 * /tokenCache/wordSaleVotesDetails:
 *   get:
 *     tags:
 *       - tokencache
 *     summary: Get word sale vote details for address
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
router.get('/wordSaleVotesDetails', TokenCacheLogic.wordSaleVotesDetails);

module.exports = router;
