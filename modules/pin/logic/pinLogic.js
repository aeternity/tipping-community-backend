const { Pin } = require('../../../models');
const { PINNED_CONTENT_TYPES } = require('../constants/contentTypes');
const TipLogic = require('../../tip/logic/tipLogic');
const logger = require('../../../utils/logger')(module);

module.exports = class PinLogic {
  static async addItem(req, res) {
    try {
      const {
        entryId, type, signature, challenge,
      } = req.body;
      const { author } = req.params;
      if (!entryId || !type || !author || !signature || !challenge) res.status(400).send('Missing required field');
      if (!PINNED_CONTENT_TYPES[type]) return res.status(400).send(`Send type is invalid ${type}`);
      const entry = await Pin.create({
        entryId, type, author, signature, challenge,
      });
      return res.send(entry);
    } catch (e) {
      logger.error(e);
      return res.status(500).send(e.message);
    }
  }

  static async removeItem(req, res) {
    const result = await Pin.destroy({
      where: {
        entryId: req.body.entryId,
        author: req.params.author,
        type: req.body.type,
      },
    });
    return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
  }

  static async getAllItemsPerUser(req, res) {
    const tips = await TipLogic.fetchAllLocalTips();
    const pins = (await Pin.findAll({ where: { author: req.params.author }, raw: true }))
      .filter(pin => pin.type === PINNED_CONTENT_TYPES.TIP).map(pin => pin.entryId);
    return res.send(tips.filter(({ id }) => pins.includes(String(id))));
  }
};
