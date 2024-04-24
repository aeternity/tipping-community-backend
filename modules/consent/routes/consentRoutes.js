import express from 'express';
import ConsentLogic from '../logic/consentLogic.js';
import { CONSENT_STATES } from '../constants/consentStates.js';
import authenticationLogic from '../../authentication/logic/authenticationLogic.js';

const { Router } = express;
const { signatureAuth } = authenticationLogic;
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
router.get('/:author', signatureAuth, async (req, res) => {
  const { author } = req.params;
  res.send(await ConsentLogic.getAllItemsForUser(author));
});
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
router.get('/:author/:scope', signatureAuth, async (req, res) => {
  const { author, scope } = req.params;
  const result = await ConsentLogic.getSingleItem(author, scope);
  return result ? res.send(result.toJSON()) : res.sendStatus(404);
});
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
router.post('/:author/:scope', signatureAuth, async (req, res) => {
  const { status, signature, challenge } = req.body;
  const { author, scope } = req.params;
  if (Object.values(CONSENT_STATES).indexOf(status) === -1) {
    return res.status(400).send(`Unknown status ${status}`);
  }
  const result = await ConsentLogic.upsertItem({
    author,
    scope,
    status,
    signature,
    challenge,
  });
  return res.send(result);
});
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
router.delete('/:author/:scope', signatureAuth, async (req, res) => {
  const { author, scope } = req.params;
  const result = await ConsentLogic.removeItem(author, scope);
  return result === 1 ? res.sendStatus(204) : res.sendStatus(404);
});
export default router;
