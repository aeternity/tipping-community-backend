const { Router } = require('express');
const ConsentLogic = require('../logic/consentLogic');
const { signatureAuth } = require('../utils/auth.js');

const router = new Router();

/**
 * @swagger
 * /consent/{author}:
 *   get:
 *     summary: Returns all consent domains for a user
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
 *         description: Returns all consent domains for a user
 *         content:
 *           application/json:
 *             schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/SignatureResponse'
 *                - type: array
 *                  items:
 *                    $ref: '#/components/schemas/Consent'
 */
router.get('/:author', signatureAuth, ConsentLogic.getAllItemsForUser);
/**
 * @swagger
 * /consent/{author}/{scope}:
 *   get:
 *     summary: Returns an item for a given user & scope
 *     security:
 *       - signatureAuth: []
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns an item for a given user & scope
 *         content:
 *           application/json:
 *             schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/SignatureResponse'
 *                - $ref: '#/components/schemas/Consent'
 */
router.get('/:author/:scope', signatureAuth, ConsentLogic.getSingleItem);

/**
 * @swagger
 * /consent/{author}/{scope}:
 *   post:
 *     summary: Update consent settings for a given user & scope
 *     security:
 *       - signatureAuth: []
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/Consent'
 *               - $ref: '#/components/schemas/SignatureRequest'
 *     responses:
 *       200:
 *         description: Update consent settings for a given user & scope
 *         content:
 *           application/json:
 *             schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/SignatureResponse'
 *                - $ref: '#/components/schemas/Consent'
 */
router.post('/:author/:scope', signatureAuth, ConsentLogic.upsertItem);
/**
 * @swagger
 * /consent/{author}/{scope}:
 *   delete:
 *     summary: Remove consent settings for a given user & scope
 *     security:
 *       - signatureAuth: []
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Remove consent settings for a given user & scope
 *         content:
 *           application/json:
 *             schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/SignatureResponse'
 *                - $ref: '#/components/schemas/Consent'
 */
router.delete('/:author/:scope', signatureAuth, ConsentLogic.removeItem);

module.exports = router;
