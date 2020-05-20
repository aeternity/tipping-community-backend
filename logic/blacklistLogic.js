const { BlacklistEntry } = require('../models');

module.exports = class Blacklist {

  static async augmentAllItems (allItems) {
    const blacklist = await BlacklistEntry.findAll({
      raw: true,
    });
    return allItems.map(item => ({
      ...item,
      hidden: blacklist.some(b => b.tipId === item.id && b.status === 'hidden'),
      flagged: blacklist.some(b => b.tipId === item.id && b.status === 'flagged'),
    })).sort((a, b) => b.timestamp - a.timestamp);
  }

  static async addItem (req, res) {
    try {
      const { tipId } = req.body;
      if (!tipId) throw new Error('Missing required field tipId');
      const entry = await BlacklistEntry.create({ tipId });
      res.send(entry);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }

  static async flagTip (req, res) {
    try {
      const { tipId, author } = req.body;
      if (!tipId) throw new Error('Missing required field tipId');
      if (!author) throw new Error('Missing required field author');
      let existingEntry = await BlacklistEntry.findOne({ where: { tipId }, raw: true });
      if (!existingEntry) {
        existingEntry = await BlacklistEntry.create({ tipId, flagger: author, status: 'flagged' });
      }
      res.send(existingEntry);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }

  static async updateItem (req, res) {
    try {
      const { status } = req.body;
      const tipId = req.params.tipId;
      if (!tipId) throw new Error('Missing required field tipId');
      if (!status) throw new Error('Missing required field status');
      await BlacklistEntry.update({ status }, { where: { tipId }});
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }

  static async removeItem (req, res) {
    const result = await BlacklistEntry.destroy({
      where: {
        tipId: req.params.tipId,
      },
    });
    return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
  }

  static async getAllItems (req, res) {
    res.send(await BlacklistEntry.findAll({ raw: true }));
  }

  static async getSingleItem (req, res) {
    const result = await BlacklistEntry.findOne({ where: { tipId: req.params.tipId }, raw: true });
    return result ? res.send(result) : res.sendStatus(404);
  };

};
