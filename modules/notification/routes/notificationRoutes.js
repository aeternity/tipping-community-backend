const { Router } = require('express');
const NotificationLogic = require('../logic/notificationLogic');
const { signatureAuth } = require('../../authentication/logic/authenticationLogic');

const router = new Router();
/**
 * @swagger
 * tags:
 * - name: "notifications"
 *   description: "Notifications for user / system actions on superhero"
 */

/**
 * @swagger
 * /notification/user/{author}:
 *   get:
 *     tags:
 *       - notifications
 *     summary: Get all notifications for a single user
 *     security:
 *       - signatureAuth: []
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
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
 * /notification:
 *   post:
 *     tags:
 *       - notifications
 *     summary: Update an array notifications
 *     security:
 *       - signatureAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [ ids, status, author ]
 *                 properties:
 *                   ids:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   status:
 *                     type: string
 *                     enum:
 *                       - CREATED
 *                       - PEEKED
 *                       - READ
 *                   author:
 *                     type: string
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
router.post('/', signatureAuth, async (req, res) => {
  const { ids, status } = req.body;
  if (!ids || !status) return res.status(400).send('Missing required field ids or status');
  const result = await NotificationLogic.bulkUpdateNotificationStatus(ids, status);
  return res.send(result.map(notification => notification.toJSON().id));
});

/**
 * @swagger
 * /notification/{notificationId}:
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
 *                 required: [ status, author ]
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - CREATED
 *                       - PEEKED
 *                       - READ
 *                   author:
 *                     type: string
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
router.post('/:notificationId', signatureAuth, NotificationLogic.updateNotificationState);

module.exports = router;
