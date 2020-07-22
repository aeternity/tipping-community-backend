const { Router } = require('express');
const NotificationLogic = require('../logic/notificationLogic.js');
const { signatureAuth } = require('../utils/auth.js');

const router = new Router();

// Get notifications (ordered by date)
// Get unread notifications
// Mark notification as read
// ? Expose notification types
router.get('/user/:author', signatureAuth, NotificationLogic.getForUser);

router.post('/:notificationId', signatureAuth, NotificationLogic.markRead);

router.get('/static/types', NotificationLogic.sendTypes);

module.exports = router;
