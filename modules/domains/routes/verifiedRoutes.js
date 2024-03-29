const { Router } = require('express');
const CacheLogic = require('../../cache/logic/cacheLogic');

const router = new Router();

/**
 * @swagger
 * tags:
 * - name: "verified"
 *   description: "A dynamic list of successfully claimed urls"
 */

/**
 * @swagger
 * /verified:
 *   get:
 *     tags:
 *       - verified
 *     summary: Returns a list of domains where claiming tips has already worked
 *     responses:
 *       200:
 *         description: Returns a list of domains where claiming tips has already worked
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 format: url
 */
router.get('/', async (req, res) => {
  const allClaimedDomains = await CacheLogic.getOracleAllClaimedUrls();
  return res.send(allClaimedDomains);
});

module.exports = router;
