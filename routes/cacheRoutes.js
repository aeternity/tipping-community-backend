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
 *         type: string
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
 *           enums:
 *             - highest
 *             - hot
 *             - latest
 *         description: parameter to order the tips by
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         default: 0
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

router.get('/stats', CacheLogic.deliverStats);

router.get('/userStats', CacheLogic.deliverUserStats);

router.get('/chainNames', CacheLogic.deliverChainNames);

router.get('/price', CacheLogic.deliverPrice);

router.get('/oracle', CacheLogic.deliverOracleState);

router.get('/topics', CacheLogic.deliverTipTopics);

router.get('/events', CacheLogic.deliverContractEvents);

router.get('/invalidate/tips', CacheLogic.invalidateTips);

router.get('/invalidate/oracle', CacheLogic.invalidateOracle);

router.get('/invalidate/events', CacheLogic.invalidateContractEvents);

router.get('/invalidate/token/:token', CacheLogic.invalidateTokenCache);

module.exports = router;
