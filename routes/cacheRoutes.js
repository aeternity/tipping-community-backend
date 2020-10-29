const { Router } = require('express');
const CacheLogic = require('../logic/cacheLogic.js');

const router = new Router();

CacheLogic.init(); // calls init

// Open api routes
/**
 * @swagger
 * /cache/tip:
 *   get:
 *     summary: Returns a single tip
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a single tip
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tip'
 */
router.get('/tip', CacheLogic.deliverTip);

/**
 * @swagger
 * /cache/tips:
 *   get:
 *     summary: Returns an array of tips
 *     parameters:
 *       - in: query
 *         name: address
 *         required: false
 *         schema:
 *           type: string
 *         description: users address to only query tips from this specific user
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: string to look for in the tip body
 *       - in: query
 *         name: language
 *         required: false
 *         schema:
 *           type: string
 *         description: string to match against the automatically identified language code
 *       - in: query
 *         name: ordering
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - highest
 *             - hot
 *             - latest
 *         description: parameter to order the tips by
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: page number
 *     responses:
 *       200:
 *         description: Returns an array of tips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tip'
 */
router.get('/tips', CacheLogic.deliverTips);

/**
 * @swagger
 * /cache/stats:
 *   get:
 *     summary: Returns aggregated stats for superhero
 *     responses:
 *       200:
 *         description: Returns aggregated stats for superhero
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/stats', CacheLogic.deliverStats);

/**
 * @swagger
 * /cache/userStats:
 *   get:
 *     summary: Returns aggregated stats for a single address
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: users address to only query stats for this specific user
 *     responses:
 *       200:
 *         description: Returns aggregated stats for a single address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/userStats', CacheLogic.deliverUserStats);
/**
 * @swagger
 * /cache/chainNames:
 *   get:
 *     summary: Returns all registered chainnames
 *     responses:
 *       200:
 *         description: Returns all registered chainnames
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/chainNames', CacheLogic.deliverChainNames);
/**
 * @swagger
 * /cache/price:
 *   get:
 *     summary: Returns price for ae to usd, eur & cny
 *     responses:
 *       200:
 *         description: Returns price for ae to usd, eur & cny
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 aeternity:
 *                   type: object
 *                   properties:
 *                     usd:
 *                       type: number
 *                       format: float
 *                     eur:
 *                       type: number
 *                       format: float
 *                     cny:
 *                       type: number
 *                       format: float
 */
router.get('/price', CacheLogic.deliverPrice);
/**
 * @swagger
 * /cache/oracle:
 *   get:
 *     summary: Returns the current state of the oracle contract
 *     responses:
 *       200:
 *         description: Returns the current state of the oracle contract
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/oracle', CacheLogic.deliverOracleState);
/**
 * @swagger
 * /cache/topics:
 *   get:
 *     summary: Returns an scored list of all tip topics
 *     responses:
 *       200:
 *         description: Returns an scored list of all tip topics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: integer
 *                   totalScore:
 *                     type: integer
 *                   count:
 *                     type: integer
 */
router.get('/topics', CacheLogic.deliverTipTopics);
/**
 * @swagger
 * /cache/events:
 *   get:
 *     summary: Returns all chain events related to the tipping contracts
 *     parameters:
 *       - in: query
 *         name: address
 *         description: caller address to filter the events by
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: event
 *         description: Event type to filter the events by
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         description: max amount of events returned
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Returns an sorted list of all tip events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/events', CacheLogic.deliverContractEvents);
/**
 * @swagger
 * /cache/invalidate/tips:
 *   get:
 *     summary: Invalidates the tip cache
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/tips', CacheLogic.invalidateTips);
/**
 * @swagger
 * /cache/invalidate/oracle:
 *   get:
 *     summary: Invalidates the oracle contract state cache
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/oracle', CacheLogic.invalidateOracle);
/**
 * @swagger
 * /cache/invalidate/events:
 *   get:
 *     summary: Invalidates the chain events cache
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/events', CacheLogic.invalidateContractEvents);

router.get('/invalidate/token/:token', CacheLogic.invalidateTokenCache);

module.exports = router;
