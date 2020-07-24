const { Notification, Comment } = require('../models');
const { NOTIFICATION_TYPES, ENTITY_TYPES, NOTIFICATION_STATES } = require('../models/enums/notification');

module.exports = class NotificationLogic {
  static async sendTypes(req, res) {
    res.send({ NOTIFICATION_TYPES, ENTITY_TYPES, NOTIFICATION_STATES });
  }

  static add = {
    [NOTIFICATION_TYPES.COMMENT_ON_TIP]: async (receiver, commentId) => {
      Notification.create({
        receiver,
        type: NOTIFICATION_TYPES.COMMENT_ON_TIP,
        entityId: commentId,
        entityType: ENTITY_TYPES.COMMENT,
      });
    },
    [NOTIFICATION_TYPES.COMMENT_ON_COMMENT]: async (receiver, commentId) => {
      Notification.create({
        receiver,
        type: NOTIFICATION_TYPES.COMMENT_ON_COMMENT,
        entityId: commentId,
        entityType: ENTITY_TYPES.COMMENT,
      });
    },
  }

  static async getForUser(req, res) {
    try {
      const { author } = req.params;
      if (!author) return res.status(400).send('Missing required field author');
      const allEntries = await Notification.findAll({ where: { receiver: author }, raw: true });
      return res.send(allEntries);
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  static async markRead(req, res) {
    try {
      const { notificationId } = req.params;
      const { status } = req.body;
      if (!notificationId) return res.status(400).send('Missing required field tipId');
      await Notification.update({ status }, { where: { id: notificationId } });
      return res.send((await Notification.findOne({ where: { id: notificationId } })).toJSON());
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  static async handleNewTip(tip) {
    // TIP ON COMMENT
    const commentMatch = tip.url.match(/https:\/\/superhero\.com\/tip\/(\d+)\/comment\/(\d+)/);
    if (commentMatch) {
      const commentId = commentMatch[2];
      const comment = await Comment.findOne({ where: { id: commentId }, raw: true });
      Notification.create({
        receiver: comment.author,
        entityType: ENTITY_TYPES.TIP,
        entityId: tip.id,
        type: NOTIFICATION_TYPES.TIP_ON_COMMENT,
      });
    }
  }

  static async handleNewRetip(retip) {
    // RETIP ON TIP
    // Do not create notifications for rather old retips
    // 2020, 6, 24 === 24.07.2020
    if (retip.timestamp > (new Date(2020, 6, 24)).getTime()) {
      Notification.create({
        receiver: retip.parentTip.sender,
        entityType: ENTITY_TYPES.TIP,
        entityId: retip.parentTip.id,
        type: NOTIFICATION_TYPES.RETIP_ON_TIP,
      });
    }
  }
};
