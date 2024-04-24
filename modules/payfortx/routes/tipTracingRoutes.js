import express from 'express';
import TipTracing from '../logic/tipTracingLogic.js';

const { Router } = express;
const router = new Router();
/**
 * @swagger
 * tags:
 * - name: "tiptracing"
 *   description: "Debugging information for claiming tips"
 */
/**
 * @swagger
 * /tracing/backend:
 *   get:
 *     tags:
 *       - tiptracing
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
 *     tags:
 *       - tiptracing
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
export default router;
