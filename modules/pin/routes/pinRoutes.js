import express from 'express';
import PinLogic from '../logic/pinLogic.js';
import { PINNED_CONTENT_TYPES } from '../constants/contentTypes.js';
import authenticationLogic from '../../authentication/logic/authenticationLogic.js';

const { Router } = express;
const { signatureAuth } = authenticationLogic;
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
router.get('/:author', async (req, res) => {
  res.send(await PinLogic.getAllItemsPerUser(req.params.author));
});
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
 *                 required: [ entryId, type ]
 *                 properties:
 *                   entryId:
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
router.post('/:author', signatureAuth, async (req, res) => {
  const {
    entryId, type, signature, challenge,
  } = req.body;
  const { author } = req.params;
  if (!PINNED_CONTENT_TYPES[type]) return res.status(400).send(`Send type is invalid ${type}`);
  const entry = await PinLogic.addItem({
    entryId, type, author, signature, challenge,
  });
  return res.send(entry);
});
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
router.delete('/:author', signatureAuth, async (req, res) => {
  const result = await PinLogic.removeItem(req.body.entryId, req.params.author, req.body.type);
  return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
});
export default router;
