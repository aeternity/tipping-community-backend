const { Router } = require('express');
const TokenCacheLogic = require('../logic/tokenCacheLogic.js');

const router = new Router();

// Open api routes
/**
 * @swagger
 * /tokenCache/tokenInfo:
 *   get:
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

module.exports = router;
