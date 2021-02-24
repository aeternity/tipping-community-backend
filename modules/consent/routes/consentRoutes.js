const { Router } = require('express');
const ConsentLogic = require('../logic/consentLogic');
const { signatureAuth } = require('../../authentication/logic/authenticationLogic');

const router = new Router();

/**
 * @swagger
 * tags:
 * - name: "consent"
 *   description: "Consent storage for third party rich media integrations"
 */

/**
 * @swagger
 * /consent/{author}:
 *   get:
 *     tags:
 *       - consent
 *     summary: Returns all consent domains for a user
 *     security:
 *       - signatureAuth: []
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: challenge
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: signature
 *         required: false
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
 *     tags:
 *       - consent
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
 *       - in: query
 *         name: challenge
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: signature
 *         required: false
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
 *     tags:
 *       - consent
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
 *               - $ref: '#/components/schemas/Consent-author-scope'
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
 *     tags:
 *       - consent
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
