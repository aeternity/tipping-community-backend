const { Router } = require('express');
const HealthLogic = require('../logic/healthLogic');

const router = new Router();
/**
 * @swagger
 * tags:
 * - name: "health"
 *   description: "Asses the health of the backend"
 */

/**
 * @swagger
 * /health/backend:
 *   get:
 *     tags:
 *       - health
 *     summary: Returns health states of all backend service areas
 *     responses:
 *       200:
 *         description: Returns health states of all backend service areas
 *         content:
 *           application/json:
 *             schema:
 *              type: object
 *              properties:
 *                dbHealth:
 *                  type: boolean
 *                ipfsHealth:
 *                  type: boolean
 *                redisHealth:
 *                  type: boolean
 *                aeHealth:
 *                  type: boolean
 *                allHealthy:
 *                  type: boolean
 */
router.get('/backend', HealthLogic.answerHealthRequest);

module.exports = router;
