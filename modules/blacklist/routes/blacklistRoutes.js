const { Router } = require('express');
const BigNumber = require('bignumber.js');
const { BlacklistEntry } = require('../../../models');
const Logic = require('../logic/blacklistLogic');
const TipLogic = require('../../tip/logic/tipLogic');
const { basicAuth, signatureAuth } = require('../../authentication/logic/authenticationLogic');

const router = new Router();

/**
 * @swagger
 * tags:
 * - name: "blacklist"
 *   description: "Flagging / Removing tips from the feed"
 */

// Open api routes
/**
 * @swagger
 * /blacklist/api:
 *   get:
 *     tags:
 *       - blacklist
 *     summary: Returns the complete blacklist
 *     responses:
 *       200:
 *         description: Returns the complete blacklist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BlacklistEntry'
 */
router.get('/api', async (req, res) => {
  res.send(await BlacklistEntry.findAll({ raw: true }));
});
/**
 * @swagger
 * /blacklist/api/{tipId}:
 *   get:
 *     tags:
 *       - blacklist
 *     summary: Returns blacklist status for a tipId
 *     parameters:
 *       - in: path
 *         name: tipId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: blacklist status for a tipId
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/BlacklistEntry'
 */
router.get('/api/:tipId', async (req, res) => {
  const result = await BlacklistEntry.findOne({ where: { tipId: req.params.tipId } });
  return result ? res.send(result.toJSON()) : res.sendStatus(404);
});

// View routes
/**
 * @swagger
 * /blacklist:
 *   get:
 *     tags:
 *       - blacklist
 *     summary: Returns Userinterface to flag / unflag / remove tips
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: set limit of shown tips
 *       - in: query
 *         name: address
 *         required: false
 *         schema:
 *           type: string
 *         description: users address to only query tips from this specific user
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: string
 *         description: show specific tip by id
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *            type: string
 *            enum:
 *              - posts
 *              - tips
 *         description: filter only posts or tips
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
 *         name: show
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - hidden
 *             - flagged
 *         description: filter the hidden or flagged post
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get('/', async (req, res) => {
  const limit = req.query.limit || 30;
  const page = req.query.page || 1;
  const ordering = req.query.ordering || 'latest';
  const { show, type } = req.query;
  let items = await Logic.augmentAllItems(await TipLogic.fetchAllLocalTips());

  if (req.query.id) {
    items = [items.find(e => e.id === req.query.id)];
  }

  if (req.query.address) {
    items = items.filter(e => e.sender === req.query.address);
  }

  if (show) {
    switch (show) {
      case 'hidden':
        items = items.filter(e => e.hidden);
        break;
      case 'flagged':
        items = items.filter(e => e.flagged);
        break;
      default:
    }
  }

  if (type) {
    switch (type) {
      case 'posts':
        items = items.filter(e => e.type === 'POST_WITHOUT_TIP');
        break;
      case 'tips':
        items = items.filter(e => e.type === 'AE_TIP');
        break;
      default:
    }
  }

  switch (ordering) {
    case 'hot':
      items.sort((a, b) => b.score - a.score);
      break;
    case 'latest':
      items.sort((a, b) => b.timestamp - a.timestamp);
      break;
    case 'highest':
      items.sort((a, b) => new BigNumber(b.total_amount).minus(a.total_amount).toNumber());
      break;
    default:
  }
  const length = Math.ceil(items.length / limit);
  items = items.slice((page - 1) * limit, page * limit);

  return res.render('admin', {
    items,
    length,
    query: {
      page,
      limit,
      show,
      type,
      ordering,
    },
  });
});

// Restricted api routes
/**
 * @swagger
 * /blacklist/api:
 *   post:
 *     tags:
 *       - blacklist
 *     summary: Adds tip to blacklist
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlacklistEntry-author'
 *     responses:
 *       200:
 *         description: created blacklist entry
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/BlacklistEntry'
 */
router.post('/api', basicAuth, async (req, res) => {
  try {
    const { tipId } = req.body;
    if (!(await TipLogic.checkTipExists(tipId))) {
      return res.status(400).send({ error: `Tip with id ${tipId} is unknown` });
    }
    return res.send(await Logic.addItem(tipId));
  } catch (e) {
    return res.status(500).send({ error: e.message });
  }
});
/**
 * @swagger
 * /blacklist/api/{tipId}:
 *   put:
 *     tags:
 *       - blacklist
 *     summary: Updates status of blacklisted tip
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: tipId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlacklistEntry-tipId'
 *     responses:
 *       200:
 *         description: updated blacklist entry
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/BlacklistEntry'
 */
router.put('/api/:tipId', basicAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const { tipId } = req.params;
    if (!tipId) return res.status(400).send('Missing required field tipId');
    if (!status) return res.status(400).send('Missing required field status');
    await Logic.updateItem(tipId, status);
    return res.sendStatus(200);
  } catch (e) {
    return res.status(500).send(e.message);
  }
});
/**
 * @swagger
 * /blacklist/api/{tipId}:
 *   delete:
 *     tags:
 *       - blacklist
 *     summary: Removes tip from blacklist
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: tipId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/api/:tipId', basicAuth, async (req, res) => {
  const result = await Logic.removeItem(req.params.tipId);
  return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
});

// Public routes
/**
 * @swagger
 * /blacklist/api/wallet:
 *   post:
 *     tags:
 *       - blacklist
 *     summary: Adds tip to blacklist
 *     security:
 *       - signatureAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/BlacklistEntry'
 *               - $ref: '#/components/schemas/SignatureRequest'
 *     responses:
 *       200:
 *         description: created blacklist entry
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                - $ref: '#/components/schemas/BlacklistEntry'
 *                - $ref: '#/components/schemas/SignatureResponse'
 */
router.post('/api/wallet', signatureAuth, async (req, res) => {
  try {
    const { author, tipId } = req.body;
    if (!tipId) return res.status(400).send('Missing required field tipId');
    if (!author) return res.status(400).send('Missing required field author');
    const entry = await Logic.flagTip(tipId, author);
    return res.send(entry);
  } catch (e) {
    return res.status(500).send(e.message);
  }
});

module.exports = router;
