const { Router } = require('express');
const BigNumber = require('bignumber.js');
const Fuse = require('fuse.js');
const { Op } = require('sequelize');
const CacheLogic = require('../logic/cacheLogic');
const ProfileLogic = require('../../profile/logic/profileLogic');
const cacheAggregatorLogic = require('../logic/cacheAggregatorLogic');
const { topicsRegex } = require('../../aeternity/utils/tipTopicUtil');
const searchOptions = require('../constants/searchOptions');
const queueLogic = require('../../queue/logic/queueLogic');
const { getTipTopics } = require('../../aeternity/utils/tipTopicUtil');
const { MESSAGES, MESSAGE_QUEUES } = require('../../queue/constants/queue');
const { Event } = require('../../../models');

const router = new Router();

const wordbazaarMiddleware = (req, res, next) => {
  if (process.env.WORD_REGISTRY_CONTRACT) return next();
  return res.status(403).send('NotImplemented');
};

/**
 * @swagger
 * tags:
 * - name: "cache"
 *   description: "Caching blockchain information"
 */

// Open api routes
/**
 * @swagger
 * /cache/tip:
 *   get:
 *     tags:
 *       - cache
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
router.get('/tip', async (req, res) => {
  const tips = await cacheAggregatorLogic.getAllTips(false);
  const result = tips.find(tip => tip.id === req.query.id);
  return result ? res.send(result) : res.sendStatus(404);
});

/**
 * @swagger
 * /cache/tips:
 *   get:
 *     tags:
 *       - cache
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
 *       - in: query
 *         name: contractVersion
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum:
 *               - v1
 *               - v2
 *               - v3
 *         description: use this parameter once or more times to only include tips from certain contract versions in your request
 *       - in: query
 *         name: blacklist
 *         required: false
 *         schema:
 *           type: boolean
 *         description: filter blacklisted tips
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
router.get('/tips', async (req, res) => {
  const limit = 30;
  let tips = await cacheAggregatorLogic.getAllTips(req.query.blacklist);

  if (req.query.address) {
    tips = tips.filter(tip => tip.sender === req.query.address);
  }

  if (req.query.contractVersion) {
    const contractVersions = Array.isArray(req.query.contractVersion) ? req.query.contractVersion : [req.query.contractVersion];
    tips = tips.filter(tip => contractVersions.includes((tip.id.split('_')[1] ? tip.id.split('_')[1] : 'v1')));
  }

  if (req.query.search) {
    let searchTips = tips;

    // if topics exist, only show topics
    const searchTopics = req.query.search.match(topicsRegex);
    if (searchTopics) {
      searchTips = tips.filter(tip => searchTopics.every(topic => tip.topics.includes(topic)));
    }

    // otherwise fuzzy search all content
    if (searchTopics === null || searchTips.length === 0) {
      // TODO consider indexing
      searchTips = new Fuse(tips, searchOptions).search(req.query.search).map(result => {
        const tip = result.item;
        tip.searchScore = result.item.score;
        return tip;
      });
    }

    tips = searchTips;
  }
  if (req.query.language) {
    const requestedLanguages = req.query.language.split('|');
    tips = tips.filter(tip => tip.preview && requestedLanguages.includes(tip.preview.lang)
      && (!tip.contentLanguage || requestedLanguages.includes(tip.contentLanguage)));
  }

  if (req.query.ordering) {
    switch (req.query.ordering) {
      case 'hot':
        tips.sort((a, b) => b.score - a.score);
        break;
      case 'latest':
        tips.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'highest':
        tips.sort((a, b) => new BigNumber(b.total_amount).minus(a.total_amount).toNumber());
        break;
      default:
    }
  }

  if (req.query.page) {
    tips = tips.slice((req.query.page - 1) * limit, req.query.page * limit);
  }

  res.send(tips);
});

/**
 * @swagger
 * /cache/stats:
 *   get:
 *     tags:
 *       - cache
 *     summary: Returns aggregated stats for superhero
 *     responses:
 *       200:
 *         description: Returns aggregated stats for superhero
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/stats', async (req, res) => {
  res.send(await CacheLogic.fetchStats());
});

/**
 * @swagger
 * /cache/userStats:
 *   get:
 *     tags:
 *       - cache
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
router.get('/userStats', async (req, res) => {
  res.send(await CacheLogic.getUserStats(req.query.address));
});

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
  res.send(await CacheLogic.fetchChainNames(profiles));
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
router.get('/price', async (req, res) => {
  res.send(await CacheLogic.fetchPrice());
});

/**
 * @swagger
 * /cache/topics:
 *   get:
 *     tags:
 *       - cache
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
router.get('/topics', async (req, res) => {
  const tips = await CacheLogic.getTips();
  res.send(getTipTopics(tips));
});

/**
 * @swagger
 * /cache/events:
 *   get:
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
  res.send(await Event.findAll({
    where: {
      ...(typeof req.query.address !== 'undefined') && {
        addresses: {
          [Op.contains]: [req.query.address],
        },
      },
      ...(typeof req.query.event !== 'undefined') && {
        name: req.query.event,
      },
    },
    order: [
      ['height', 'DESC'],
      ['time', 'DESC'],
      ['nonce', 'DESC'],
    ],
    limit: req.query.limit ? req.query.limit : null,
  }));
});

/**
 * @swagger
 * /cache/invalidate/tips:
 *   get:
 *     tags:
 *       - cache
 *     summary: Invalidates the tip cache
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/invalidate/tips', async (req, res) => {
  await queueLogic.sendMessage(MESSAGE_QUEUES.CACHE, MESSAGES.CACHE.EVENTS.TIP_INVALIDATION_REQUEST);
  if (res) res.send({ status: 'OK' });
});
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
  if (res) res.send({ status: 'OK' });
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
router.get('/invalidate/events', async (req, res) => {
  if (res) res.send({ status: 'OK' });
});
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

module.exports = router;
