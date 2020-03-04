const { BlacklistEntry } = require('../models');

module.exports = class Blacklist {

  static async augmentAllItems (allItems) {
    const blacklist = (await BlacklistEntry.findAll({
      attributes: ['tipId'],
      raw: true,
    })).map(entry => entry.tipId);
    return allItems.map(item => ({
      ...item,
      blocked: blacklist.some(b => b === item.id),
    }));
  }

  static async addItem (req, res) {

    try {
      const { id } = req.body;
      if (!id) throw new Error('Missing required field id');
      const entry = await BlacklistEntry.create({ tipId: id });
      res.send(entry);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }

  static async removeItem (req, res) {
    const result = await BlacklistEntry.destroy({
      where: {
        tipId: req.params.id,
      },
    });
    return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
  }

  static async getAllItems (req, res) {
    res.send(await BlacklistEntry.findAll({ raw: true }));
  }

  static async getSingleItem (req, res) {
    const result = await BlacklistEntry.findOne({ where: { tipId: req.params.id }, raw: true });
    return result ? res.send(result) : res.sendStatus(404);
  };

};
