const { Comment, Profile, Tip } = require('../../../models');
const NotificationLogic = require('../../notification/logic/notificationLogic');
const cache = require('../../cache/utils/cache');
const { NOTIFICATION_TYPES } = require('../../notification/constants/notification');

module.exports = class CommentLogic {
  static async addItem(req, res) {
    try {
      const {
        tipId, text, author, signature, challenge, parentId,
      } = req.body;
      if (tipId === null || tipId === undefined || !text || !author || !signature || !challenge) {
        return res.status(400).send('Missing required field');
      }
      const parentComment = (typeof parentId !== 'undefined' && parentId !== '')
        ? await Comment.findOne({ where: { id: parentId } }, { raw: true }) : null;
      if (parentComment === null && typeof parentId !== 'undefined' && parentId !== '') {
        return res.status(400).send(`Could not find parent comment with id ${parentId}`);
      }

      const relevantTip = await Tip.findOne(tipId);
      if (!relevantTip) return res.status(400).send(`Could not find tip with id ${tipId}`);

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

      return res.send(entry);
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  static async removeItem(req, res) {
    const result = await Comment.destroy({
      where: {
        id: req.params.id,
      },
    });
    return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
  }

  static async getAllItemsForThread(req, res) {
    res.send((await Comment.findAll({
      where: { tipId: req.params.tipId },
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    })).map(comment => comment.toJSON()));
  }

  static async getAllItemsForAuthor(req, res) {
    res.send((await Comment.findAll({
      where: { author: req.params.author },
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    })).map(comment => comment.toJSON()));
  }

  static async getAllItems(req, res) {
    res.send((await Comment.findAll({
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    })).map(comment => comment.toJSON()));
  }

  static async getSingleItem(req, res) {
    const result = await Comment.findOne({
      where: { id: req.params.id },
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    });
    return result ? res.send(result.toJSON()) : res.sendStatus(404);
  }

  // TODO move to stats
  static async fetchCommentCountForAddress(address) {
    return Comment.count({ where: { author: address } });
  }

  // TODO move to stats
  static async getCommentCountForAddress(req, res) {
    return res.send({
      count: await CommentLogic.fetchCommentCountForAddress(req.params.author),
      author: req.params.author,
    });
  }

  // TODO move to stats
  static fetchCommentCountForTips() {
    return Comment.count({ group: ['tipId'] });
  }

  // TODO move to stats
  static async getCommentCountForTips(req, res) {
    return res.send(await CommentLogic.fetchCommentCountForTips());
  }

  static async updateItem(req, res) {
    const { text, author, hidden } = req.body;
    if (!author) return res.status(400).send({ err: 'Author required' });
    if (!text && !hidden) return res.status(400).send({ err: 'Missing at least one updatable field' });
    await Comment.update({
      ...text && { text },
      ...hidden && { hidden },
    }, { where: { id: req.params.id }, raw: true });
    const result = await Comment.findOne({ where: { id: req.params.id }, raw: true });
    return result ? res.send(result) : res.sendStatus(404);
  }

  static async verifyAuthor(req, res, next) {
    if (!req.body.author) return res.status(400).send({ err: 'Author required' });
    const result = await Comment.findOne({ where: { id: req.params.id, author: req.body.author }, raw: true });
    return result ? next() : res.status(404).send({ err: `Could not find comment with id ${req.params.id} and ${req.body.author} as author` });
  }
};
