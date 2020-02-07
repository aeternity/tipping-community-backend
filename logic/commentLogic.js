const { Comment } = require('../utils/database.js');

module.exports = class CommentLogic {

  static async addItem (req, res) {

    try {
      const { tipId, text, author, signature } = req.body;
      if (!tipId || !text || !author || !signature) return res.status(400).send('Missing required field');
      const entry = await Comment.create({ tipId, text, author, signature });
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
    const { tipId, text, author, signature, hidden } = req.body;
    if (!tipId && !text && !author && !signature && !hidden) return res.status(400).send('Missing at least one updatable field');
    await Comment.update({
      ...tipId && { tipId },
      ...text && { text },
      ...author && { author },
      ...signature && { signature },
      ...hidden && { hidden },
    }, { where: { id: req.params.id }, raw: true });
    const result = await Comment.findOne({ where: { id: req.params.id }, raw: true });
    return result ? res.send(result) : res.sendStatus(404);
  }
};
