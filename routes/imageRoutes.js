const express = require('express');

const router = new express.Router();

// Open api routes
/**
 * @swagger
 * /images/{filename}:
 *   get:
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
