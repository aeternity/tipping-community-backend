const { Router } = require('express');
const Logic = require('../logic/linkPreviewLogic.js');

const router = new Router();
/**
 * @swagger
 * tags:
 * - name: "linkpreview"
 *   description: "Server generated link previews for tips"
 */

/**
 * @swagger
 * /linkpreview:
 *   get:
 *     tags:
 *       - linkpreview
 *     summary: Returns a link preview
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         description: url you wish to obtain a preview for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a link preview
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/LinkPreview'
 */
router.get('/', Logic.getLinkPreview);
/**
 * @swagger
 * /linkpreview/{url}:
 *   get:
 *     tags:
 *       - linkpreview
 *     summary: Returns a link preview
 *     parameters:
 *       - in: path
 *         name: url
 *         required: true
 *         description: url you wish to obtain a preview for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a link preview
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/LinkPreview'
 */
router.get('/:url', Logic.getLinkPreview);
/**
 * @swagger
 * /linkpreview/image/{filename}:
 *   get:
 *     tags:
 *       - linkpreview
 *     summary: Returns a link preview image
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         description: image filename
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a link preview image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/image/:filename', Logic.getImage);

module.exports = router;
