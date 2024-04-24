import express from 'express';
import CacheLogic from '../logic/cacheLogic.js';
import ProfileLogic from '../../profile/logic/profileLogic.js';
import EventLogic from '../../event/logic/eventLogic.js';

const { Router } = express;
const router = new Router();
const wordbazaarMiddleware = (req, res, next) => {
  if (process.env.WORD_REGISTRY_CONTRACT) return next();
  return res.status(403).send('NotImplemented');
};
/**
 * @swagger
 * /cache/chainNames:
 *   get:
 *     tags:
 *       - cache
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
router.get('/chainNames', async (req, res) => {
  const profiles = await ProfileLogic.getAllProfiles();
  return res.send(await CacheLogic.fetchChainNames(profiles));
});
/**
 * @swagger
 * /cache/price:
 *   get:
 *     tags:
 *       - cache
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
router.get('/price', async (req, res) => res.send(await CacheLogic.fetchPrice()));
/**
 * @swagger
 * /cache/events:
 *   get:
 *     deprecated: true
 *     tags:
 *       - cache
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
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/events', async (req, res) => {
  res.send(await EventLogic.getAllEvents(req.query.address, req.query.event, req.query.limit));
});
/**
 * @swagger
 * /cache/invalidate/tips:
 *   get:
 *     deprecated: true
 *     tags:
 *       - cache
 *     summary: Invalidates the tip cache
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/tips', async (req, res) => res.send({ status: 'OK' }));
/**
 * @swagger
 * /cache/invalidate/oracle:
 *   get:
 *     tags:
 *       - cache
 *     summary: Invalidates the oracle contract state cache
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/oracle', async (req, res) => {
  await CacheLogic.invalidateOracle();
  return res.send({ status: 'OK' });
});
/**
 * @swagger
 * /cache/invalidate/events:
 *   get:
 *     deprecated: true
 *     tags:
 *       - cache
 *     summary: Invalidates the chain events cache
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/events', async (req, res) => res.send({ status: 'OK' }));
/**
 * @swagger
 * /cache/invalidate/token/{token}:
 *   get:
 *     tags:
 *       - cache
 *     summary: Invalidates the chain events cache
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         description: The token contract address that the cache should be invalidated for
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/token/:token', async (req, res) => {
  await CacheLogic.invalidateTokenCache(req.params.token);
  await CacheLogic.getTokenAccounts(req.params.token); // wait for cache update to let frontend know data availability
  if (res) res.send({ status: 'OK' });
});
/**
 * @swagger
 * /cache/invalidate/wordSale/{wordSale}:
 *   get:
 *     tags:
 *       - cache
 *     summary: Invalidates the word sale cache
 *     parameters:
 *       - in: path
 *         name: wordSale
 *         schema:
 *           type: string
 *         description: The word sale contract address that the cache should be invalidated for
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/wordSale/:wordSale', wordbazaarMiddleware, async (req, res) => {
  await CacheLogic.invalidateWordSaleCache(req.params.wordSale);
  res.send({ status: 'OK' });
});
/**
 * @swagger
 * /cache/invalidate/wordRegistry:
 *   get:
 *     tags:
 *       - cache
 *     summary: Invalidates the word registry cache
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/wordRegistry', wordbazaarMiddleware, async (req, res) => {
  await CacheLogic.invalidateWordRegistryCache();
  res.send({ status: 'OK' });
});
/**
 * @swagger
 * /cache/invalidate/wordSaleVotes/{wordSale}:
 *   get:
 *     tags:
 *       - cache
 *     summary: Invalidates the word sale votes cache
 *     parameters:
 *       - in: path
 *         name: wordSale
 *         schema:
 *           type: string
 *         description: The word sale contract address that the cache should be invalidated for
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/wordSaleVotes/:wordSale', wordbazaarMiddleware, async (req, res) => {
  await CacheLogic.invalidateWordSaleVotesCache(req.params.wordSale);
  res.send({ status: 'OK' });
});
/**
 * @swagger
 * /cache/invalidate/wordSaleVoteState/{vote}:
 *   get:
 *     tags:
 *       - cache
 *     summary: Invalidates the word sale single vote cache
 *     parameters:
 *       - in: path
 *         name: vote
 *         schema:
 *           type: string
 *         description: The word sale vote contract address that the cache should be invalidated for
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/wordSaleVoteState/:vote', wordbazaarMiddleware, async (req, res) => {
  await CacheLogic.invalidateWordSaleVoteStateCache(req.params.vote);
  res.send({ status: 'OK' });
});
export default router;
