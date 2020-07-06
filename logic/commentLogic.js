const { Comment, Profile } = require('../models');

module.exports = class CommentLogic {
  static async addItem(req, res) {
    try {
      const {
        tipId, text, author, signature, challenge, parentId,
      } = req.body;
      if (tipId === null || tipId === undefined || !text || !author || !signature || !challenge) {
        return res.status(400)
          .send('Missing required field');
      }
      if (typeof parentId !== 'undefined') {
        const result = await Comment.findOne({ where: { id: parentId } }, { raw: true });
        if (result === null) return res.status(400).send({ err: `Could not find parent comment with id ${parentId}` });
      }

      const entry = await Comment.create({
        tipId, text, author, signature, challenge, parentId,
      });
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
    })).map((comment) => comment.toJSON()));
  }

  static async getAllItemsForAuthor(req, res) {
    res.send((await Comment.findAll({
      where: { author: req.params.author },
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    })).map((comment) => comment.toJSON()));
  }

  static async getAllItems(req, res) {
    res.send((await Comment.findAll({
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    })).map((comment) => comment.toJSON()));
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
    const result = await Comment.count({ where: { author: address }, raw: true });
    return result || 0;
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
    return Comment.count({ group: ['tipId'], raw: true });
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
