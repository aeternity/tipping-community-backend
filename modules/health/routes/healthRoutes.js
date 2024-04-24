import express from "express";
import HealthLogic from "../logic/healthLogic.js";

const { Router } = express;
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
router.get("/backend", async (req, res) => {
  const dbHealth = await HealthLogic.checkDBHealth();
  const ipfsHealth = await HealthLogic.checkIPFSHealth();
  const redisHealth = await HealthLogic.checkRedisHealth();
  const aeHealth = await HealthLogic.checkAEClient();
  const allHealthy = dbHealth && ipfsHealth && redisHealth && aeHealth;
  res.status(allHealthy ? 200 : 500).send({
    dbHealth,
    ipfsHealth,
    redisHealth,
    aeHealth,
    allHealthy,
  });
});
export default router;
