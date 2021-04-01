const { Router } = require('express');
const TipLogic = require('../logic/tipLogic');
const { getTipTopics } = require('../../aeternity/utils/tipTopicUtil');

const router = new Router();

/**
 * @swagger
 * /tips:
 *   get:
 *     tags:
 *       - tip
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
router.get('/', async (req, res) => {
  const tips = await TipLogic.fetchTips(req.query);
  res.send(tips);
});

/**
 * @swagger
 * /tips/single:
 *   get:
 *     tags:
 *       - tip
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
router.get('/single', async (req, res) => {
  const tip = await TipLogic.fetchTip(req.query.id);
  return tip ? res.send(tip) : res.sendStatus(404);
});

/**
 * @swagger
 * /tips/topics:
 *   get:
 *     tags:
 *       - tips
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
  const tips = await TipLogic.fetchAllLocalTipsWithAggregation();
  res.send(getTipTopics(tips));
});

/**
 * @swagger
 * /tips/await:
 *   get:
 *     tags:
 *       - tips
 *     summary: awaits tips/retips updated event
 *     responses:
 *       200:
 *         description: Returns ok
 */
router.get('/await', async (req, res) => {
  await TipLogic.awaitTipsUpdated();
  res.send({ updated: true });
});

module.exports = router;
