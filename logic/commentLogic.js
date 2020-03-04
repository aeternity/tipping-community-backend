const { Comment } = require('../models');

module.exports = class CommentLogic {

  static async addItem (req, res) {
    try {
      const { tipId, text, author, signature, challenge } = req.body;
      if (tipId === null || tipId === undefined || !text || !author || !signature || !challenge) return res.status(400).send('Missing required field');
      const entry = await Comment.create({ tipId, text, author, signature, challenge });
      res.send(entry);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }

  static async removeItem (req, res) {
    const result = await Comment.destroy({
      where: {
        id: req.params.id,
      },
    });
    return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
  }

  static async getAllItems (req, res) {
    res.send(await Comment.findAll({ raw: true }));
  }

  static async getAllItemsForThread (req, res) {
    res.send(await Comment.findAll({ where: { tipId: req.params.tipId }, raw: true }));
  }

  static async getSingleItem (req, res) {
    const result = await Comment.findOne({ where: { id: req.params.id }, raw: true });
    return result ? res.send(result) : res.sendStatus(404);
  };

  static async updateItem (req, res) {
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

  static async verifyAuthor (req, res, next) {
    if (!req.body.author) return res.status(400).send({ err: 'Author required' });
    const result = await Comment.findOne({ where: { id: req.params.id, author: req.body.author }, raw: true });
    return result ? next() : res.status(404).send({ err: `Could not find comment with id ${req.params.id} and ${req.body.author} as author` })
  }
};
