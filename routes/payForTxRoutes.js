const { Router } = require('express');
const PayForTxLogic = require('../logic/payForTxLogic.js');

const router = new Router();

/**
 * @swagger
 * tags:
 * - name: "payfortx"
 *   description: "Transaction relay service"
 */

/**
 * @swagger
 * /payfortx/submit:
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
 *                 format: url
 *               address:
 *                 type: string
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
router.post('/submit', PayForTxLogic.payForTx);

module.exports = router;
