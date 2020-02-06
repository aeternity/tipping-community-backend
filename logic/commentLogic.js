const { Comment } = require('../utils/database.js');

module.exports = class CommentLogic {

  static async addItem (req, res) {

    try {
      const { tipId, text, author, signature } = req.body;
      if (!tipId || !text || !author || !signature) throw new Error('Missing required field');
      const entry = await Comment.create( { tipId, text, author, signature });
      res.send(entry);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }

  static async removeItem (req, res) {
    await Comment.destroy({
      where: {
        tipId: req.params.id,
      },
    });
    res.sendStatus(200);
  }

  static async getAllItems (req, res) {
    res.send(await Comment.findAll({ raw: true }));
  }

  static async getSingleItem (req, res) {
    const result = await Comment.findOne({ where: { id: req.params.id }, raw: true });
    return result ? res.send(result) : res.sendStatus(404);
  };

  static async changeVisibility (req, res) {

  }

};
