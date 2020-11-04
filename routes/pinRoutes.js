const { Router } = require('express');
const Logic = require('../logic/pinLogic.js');
const { signatureAuth } = require('../utils/auth.js');

const router = new Router();

/**
 * @swagger
 * tags:
 * - name: "pin"
 *   description: "Pinning Tips to a users profile"
 */

/**
 * @swagger
 * /pin/{author}:
 *   get:
 *     tags:
 *       - pin
 *     summary: Returns all pinned tips for a single user
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns all pinned tips for a single user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tip'
 */
router.get('/:author', Logic.getAllItemsPerUser);

// Restricted api routes
/**
 * @swagger
 * /pin/{author}:
 *   post:
 *     tags:
 *       - pin
 *     summary: Add a pin to a users profile
 *     security:
 *       - signatureAuth: []
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   entityId:
 *                     type: string
 *                   type:
 *                     type: string
 *               - $ref: '#/components/schemas/SignatureRequest'
 *     responses:
 *       200:
 *         description: Returns the created pin
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                - $ref: '#/components/schemas/SignatureResponse'
 *                - $ref: '#/components/schemas/Pin'
 */
router.post('/:author', signatureAuth, Logic.addItem);
/**
 * @swagger
 * /pin/{author}:
 *   delete:
 *     tags:
 *       - pin
 *     summary: Remove a pin from a users profile (body requires entryId + type)
 *     security:
 *       - signatureAuth: []
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deletes pinned entry
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                - $ref: '#/components/schemas/SignatureResponse'
 */
router.delete('/:author', signatureAuth, Logic.removeItem);

module.exports = router;
