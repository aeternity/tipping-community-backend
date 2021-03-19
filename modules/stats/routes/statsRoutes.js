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

module.exports = router;
