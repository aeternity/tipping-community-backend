const { Router } = require('express');
const Logic = require('../logic/verifiedLogic.js');

const router = new Router();

// Open api routes
/**
 * @swagger
 * /verified/:
 *   get:
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
router.get('/', Logic.getAllClaimedEvents);

module.exports = router;
