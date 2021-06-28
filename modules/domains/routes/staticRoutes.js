const { Router } = require('express');
const StaticLogic = require('../logic/staticLogic');

const router = new Router();

/**
 * @swagger
 * tags:
 * - name: "static"
 *   description: "Various endpoints"
 */

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
router.get('/wallet/graylist', (req, res) => res.send(StaticLogic.getGrayList()));

module.exports = router;
