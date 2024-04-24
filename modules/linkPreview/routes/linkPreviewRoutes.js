import express from 'express';

const { Router } = express;
const router = new Router();
/**
 * @swagger
 * tags:
 * - name: "linkpreview"
 *   description: "Server generated link previews for tips"
 */
/**
 * @swagger
 * /linkpreview/image/{filename}:
 *   get:
 *     tags:
 *       - linkpreview
 *     deprecated: true
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
router.get('/image/:filename', (req, res) => res.redirect(301, `/images/${req.params.filename}`));
export default router;
