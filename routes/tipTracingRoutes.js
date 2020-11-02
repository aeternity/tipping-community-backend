const { Router } = require('express');
const TipTracing = require('../logic/tipTracingLogic.js');

const router = new Router();

// Open api routes
/**
 * @swagger
 * /tracing/backend:
 *   get:
 *     summary: Returns all traces for a given tipid
 *     parameters:
 *       - in: query
 *         schema:
 *           type: string
 *         description: A tipId
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Returns all traces for a given tipid
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Trace'
 */
router.get('/backend', TipTracing.getAllTraces);
/**
 * @swagger
 * /tracing/blockchain:
 *   get:
 *     summary: Returns all traces for a given tipid
 *     parameters:
 *       - in: query
 *         schema:
 *           type: string
 *         description: A tipId
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Returns all traces for a given tipid
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Trace'
 */
router.get('/blockchain', TipTracing.fetchBlockchainTrace);

module.exports = router;
