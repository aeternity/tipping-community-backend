const { Router } = require('express');
const StaticLogic = require('../logic/staticLogic.js');

const router = new Router();

/**
 * @swagger
 * tags:
 * - name: "static"
 *   description: "Various endpoints"
 */

/**
 * @swagger
 * /static/stats:
 *   get:
 *     tags:
 *       - static
 *     summary: Returns aggregated stats over time periods
 *     responses:
 *       200:
 *         description: Returns aggregated stats over time periods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: integer
 *                     yesterday:
 *                       type: integer
 *                     last7Days:
 *                       type: integer
 *                     last30Days:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                 linkPreviews:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: integer
 *                     yesterday:
 *                       type: integer
 *                     last7Days:
 *                       type: integer
 *                     last30Days:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                 profiles:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: integer
 *                     yesterday:
 *                       type: integer
 *                     last7Days:
 *                       type: integer
 *                     last30Days:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                 blacklist:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: integer
 *                     yesterday:
 *                       type: integer
 *                     last7Days:
 *                       type: integer
 *                     last30Days:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get('/stats', StaticLogic.deliverStats);
/**
 * @swagger
 * /static/wallet/graylist:
 *   get:
 *     tags:
 *       - static
 *     summary: Returns a list of domains where claiming tips can be troublesome
 *     responses:
 *       200:
 *         description: Returns a list of domains where claiming tips can be troublesome
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 format: url
 */
router.get('/wallet/graylist', StaticLogic.getGrayList);

module.exports = router;
