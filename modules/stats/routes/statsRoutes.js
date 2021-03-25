const { Router } = require('express');
const StatsLogic = require('../logic/statsLogic');

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
router.get('/', async (req, res) => {
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
router.get('/sender', async (req, res) => {
  const stats = await StatsLogic.fetchUserStats(req.query.address);
  return stats ? res.send(stats) : res.sendStatus(404);

});

module.exports = router;
