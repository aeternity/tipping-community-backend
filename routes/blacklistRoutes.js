const { Router } = require('express');
const Logic = require('../logic/blacklistLogic.js');
const CacheLogic = require('../logic/cacheLogic');
const { basicAuth, signatureAuth } = require('../utils/auth.js');

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
router.get('/api', Logic.getAllItems);
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
router.get('/api/:tipId', Logic.getSingleItem);

// View routes
/**
 * @swagger
 * /blacklist/:
 *   get:
 *     tags:
 *       - blacklist
 *     summary: Returns Userinterface to flag / unflag / remove tips
 *     security:
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get('/', basicAuth, async (req, res) => res.render('admin', {
  allItems: await Logic.augmentAllItems(await CacheLogic.getTips()),
}));

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
 *             $ref: '#/components/schemas/BlacklistEntry'
 *     responses:
 *       200:
 *         description: created blacklist entry
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/BlacklistEntry'
 */
router.post('/api', basicAuth, Logic.addItem);
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
 *             $ref: '#/components/schemas/BlacklistEntry'
 *     responses:
 *       200:
 *         description: updated blacklist entry
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/BlacklistEntry'
 */
router.put('/api/:tipId', basicAuth, Logic.updateItem);
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
router.delete('/api/:tipId', basicAuth, Logic.removeItem);

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
router.post('/api/wallet', signatureAuth, Logic.flagTip);

module.exports = router;
