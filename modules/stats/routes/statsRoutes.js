import express from "express";
import StatsLogic from "../logic/statsLogic.js";

const { Router } = express;
const router = new Router();
/**
 * @swagger
 * /stats:
 *   get:
 *     tags:
 *       - stats
 *     summary: Returns stats
 *     responses:
 *       200:
 *         description: Returns stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", async (req, res) => {
  const stats = await StatsLogic.fetchStats();
  return stats ? res.send(stats) : res.sendStatus(404);
});
/**
 * @swagger
 * /stats/sender:
 *   get:
 *     tags:
 *       - stats
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
router.get("/sender", async (req, res) => {
  const stats = await StatsLogic.fetchUserStats(req.query.address);
  return stats ? res.send(stats) : res.sendStatus(404);
});
/**
 * @swagger
 * /stats/marketing:
 *   get:
 *     tags:
 *       - stats
 *     summary: Returns marketing stats
 *     responses:
 *       200:
 *         description: Returns marketing stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/marketing", async (req, res) => res.send(await StatsLogic.fetchMarketingStats()));
export default router;
