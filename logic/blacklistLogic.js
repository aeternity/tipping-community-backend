const { BlacklistEntry } = require('../models');

module.exports = class Blacklist {
  static async augmentAllItems(allItems) {
    const blacklist = await BlacklistEntry.findAll({
      raw: true,
    });
    return allItems.map(item => ({
      ...item,
      hidden: blacklist.some(b => b.tipId === item.id && b.status === 'hidden'),
      flagged: blacklist.some(b => b.tipId === item.id && b.status === 'flagged'),
    })).sort((a, b) => b.timestamp - a.timestamp);
  }

  static async addItem(req, res) {
    try {
      const { tipId } = req.body;
      if (!tipId) return res.status(400).send('Missing required field tipId');
      const entry = await BlacklistEntry.create({ tipId });
      return res.send(entry);
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  static async flagTip(req, res) {
    try {
      const { tipId, author } = req.body;
      if (!tipId) return res.status(400).send('Missing required field tipId');
      if (!author) return res.status(400).send('Missing required field author');
      let existingEntry = await BlacklistEntry.findOne({ where: { tipId }, raw: true });
      if (!existingEntry) {
        existingEntry = await BlacklistEntry.create({ tipId, flagger: author, status: 'flagged' });
      }
      return res.send(existingEntry);
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  static async updateItem(req, res) {
    try {
      const { status } = req.body;
      const { tipId } = req.params;
      if (!tipId) return res.status(400).send('Missing required field tipId');
      if (!status) return res.status(400).send('Missing required field status');
      await BlacklistEntry.update({ status }, { where: { tipId } });
      return res.sendStatus(200);
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  static async removeItem(req, res) {
    const result = await BlacklistEntry.destroy({
      where: {
        tipId: req.params.tipId,
      },
    });
    return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
  }

  static async getAllItems(req, res) {
    res.send(await BlacklistEntry.findAll({ raw: true }));
  }

  static async getSingleItem(req, res) {
    const result = await BlacklistEntry.findOne({ where: { tipId: req.params.tipId }, raw: true });
    return result ? res.send(result) : res.sendStatus(404);
  }

  static async getBlacklistedIds() {
    const blacklist = await BlacklistEntry.findAll({ raw: true, where: { status: 'hidden' } });
    return blacklist.map(b => b.tipId);
  }
};
