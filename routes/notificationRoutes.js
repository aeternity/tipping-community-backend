const { Router } = require('express');
const NotificationLogic = require('../logic/notificationLogic.js');
const { signatureAuth } = require('../utils/auth.js');

const router = new Router();
/**
 * @swagger
 * tags:
 * - name: "notifications"
 *   description: "Notifications for user / system actions on superhero"
 */

/**
 * @swagger
 * /notifications/{notificationId}:
 *   get:
 *     tags:
 *       - notifications
 *     summary: Get all notifications for a single user
 *     security:
 *       - signatureAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: signature
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: challenge
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get all notifications for an author
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/SignatureResponse'
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 */

router.get('/user/:author', signatureAuth, NotificationLogic.getForUser);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   post:
 *     tags:
 *       - notifications
 *     summary: Update a single notifications
 *     security:
 *       - signatureAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - CREATED
 *                       - READ
 *               - $ref: '#/components/schemas/SignatureRequest'
 *     responses:
 *       200:
 *         description: Get all notifications for an author
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/SignatureResponse'
 *                 - $ref: '#/components/schemas/Notification'
 */
router.post('/:notificationId', signatureAuth, NotificationLogic.markRead);

module.exports = router;
