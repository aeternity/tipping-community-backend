const { Router } = require('express');
const TipLogic = require('../logic/tipLogic');
const router = new Router();

/**
 * @swagger
 * /tips:
 *   get:
 *     tags:
 *       - cache
 *     summary: Returns an array of tips
 *     parameters:
 *       - in: query
 *         name: address
 *         required: false
 *         schema:
 *           type: string
 *         description: users address to only query tips from this specific user
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: string to look for in the tip body
 *       - in: query
 *         name: language
 *         required: false
 *         schema:
 *           type: string
 *         description: string to match against the automatically identified language code
 *       - in: query
 *         name: ordering
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - highest
 *             - hot
 *             - latest
 *         description: parameter to order the tips by
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: page number
 *       - in: query
 *         name: contractVersion
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - v1
 *             - v2
 *             - v3
 *         description: use this parameter once or more times to only include tips from certain contract versions in your request
 *     responses:
 *       200:
 *         description: Returns an array of tips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tip'
 */
router.get('/', async (req, res) => {
  // req.query. blacklist, address, contractVersion, search, language, ordering, page

  let tips = await TipLogic.fetchTips(req.query.page);

  res.send(tips);
});

module.exports = router;
