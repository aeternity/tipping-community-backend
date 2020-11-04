const express = require('express');

const router = new express.Router();

/**
 * @swagger
 * tags:
 * - name: "images"
 *   description: "Static image endpoint"
 */

/**
 * @swagger
 * /images/{filename}:
 *   get:
 *     tags:
 *       - images
 *     summary: returns an image
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: returns an image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/', express.static('./images'));

module.exports = router;
