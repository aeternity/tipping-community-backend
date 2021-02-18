const { Comment, Profile, Tip } = require('../../../models');
const NotificationLogic = require('../../notification/logic/notificationLogic');
const cache = require('../../cache/utils/cache');
const { NOTIFICATION_TYPES } = require('../../notification/constants/notification');

const CommentLogic = {
  async addItem(tipId, text, author, signature, challenge, parentId) {
    const parentComment = (typeof parentId !== 'undefined' && parentId !== '')
      ? await Comment.findOne({ where: { id: parentId } }) : null;
    if (parentComment === null && typeof parentId !== 'undefined' && parentId !== '') {
      throw Error(`Could not find parent comment with id ${parentId}`);
    }

    const relevantTip = await Tip.findOne({ where: { id: tipId } });
    if (!relevantTip) throw Error(`Could not find tip with id ${tipId}`);

    const entry = await Comment.create({
      tipId, text, author, signature, challenge, parentId,
    });

    // Kill stats cache
    await cache.del(['StaticLogic.getStats']);

    // Create notification
    await NotificationLogic.add[NOTIFICATION_TYPES.COMMENT_ON_TIP](relevantTip.sender, entry.author, entry.id, relevantTip.id);
    if (parentComment !== null) {
      await NotificationLogic.add[NOTIFICATION_TYPES.COMMENT_ON_COMMENT](parentComment.author, entry.author, entry.id, parentComment.id);
    }
    return entry;
  },

  async removeItem(id) {
    return Comment.destroy({
      where: {
        id,
      },
    });
  },

  async fetchCommentsForAuthor(author) {
    return Comment.findAll({
      where: { author },
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    }).then(comments => comments.map(comment => comment.toJSON()));
  },

  async fetchSingleComment(commentId) {
    return Comment.findOne({
      where: { id: commentId },
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    }).then(result => (result ? result.toJSON() : null));
  },

  async fetchCommentsForTip(tipId) {
    return Comment.findAll({
      where: { tipId },
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    }).then(comments => comments.map(comment => comment.toJSON()));
  },

  async fetchCommentCountForAddress(address) {
    return Comment.count({ where: { author: address } });
  },

  fetchCommentCountForTips() {
    return Comment.count({ group: ['tipId'] });
  },

  async verifyAuthor(req, res, next) {
    if (!req.body.author) return res.status(400).send({ err: 'Author required' });
    const result = await Comment.findOne({ where: { id: req.params.id, author: req.body.author }, raw: true });
    return result ? next() : res.status(404).send({ err: `Could not find comment with id ${req.params.id} and ${req.body.author} as author` });
  },
};

module.exports = CommentLogic;
