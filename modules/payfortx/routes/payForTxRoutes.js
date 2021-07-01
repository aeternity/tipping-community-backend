const { Router } = require('express');
const PayForTxLogic = require('../logic/payForTxLogic');

const router = new Router();

/**
 * @swagger
 * tags:
 * - name: "payfortx"
 *   description: "Transaction relay service"
 */

/**
 * @swagger
 * /claim/submit:
 *   post:
 *     tags:
 *       - payfortx
 *     summary: submit a claim transaction to the oracles
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               address:
 *                 type: string
 *             required:
 *               - url
 *               - address
 *     responses:
 *       200:
 *         description: outcome of the claim submission
 *         content:
 *           application/json:
 *             schema:
 *              type: object
 *              properties:
 *                claimUUID:
 *                  type: string
 *                  format: uuid
 */
router.post('/submit', async (req, res) => {
  const claimResult = await PayForTxLogic.claimTip(req.body.url, req.body.address);
  return res.status(claimResult.error ? 500 : 200).send(claimResult);
});

/**
 * @swagger
 * /payfortx/post:
 *   post:
 *     tags:
 *       - payfortx
 *     summary: submit a post transaction for the v3 contract
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               author:
 *                 type: string
 *               title:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *               signature:
 *                 type: string
 *             required:
 *               - author
 *               - title
 *               - signature
 *     responses:
 *       200:
 *         description: result of the post
 *         content:
 *           application/json:
 *             schema:
 *              type: object
 *              properties:
 *                tx:
 *                  type: object
 */
router.post('/post', async (req, res) => {
  const signature = Uint8Array.from(Buffer.from(req.body.signature, 'hex'));

  const result = await PayForTxLogic.postForUser({
    ...req.body,
    signature,
  });
  res.status(result.error ? result.status : 200).send(result);
});

module.exports = router;
