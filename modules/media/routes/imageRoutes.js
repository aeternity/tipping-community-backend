const express = require('express');
const path = require('path');

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
 *       - in: query
 *         name: cacheBust
 *         required: false
 *         description: Pass any random string to bypass the browser cache
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
router.use('/', express.static(path.resolve('./images/')));

module.exports = router;
