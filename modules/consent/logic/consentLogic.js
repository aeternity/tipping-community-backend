const { Consent } = require('../../../models');
const { CONSENT_STATES } = require('../constants/consentStates');

module.exports = class ConsentLogic {
  static async upsertItem(req, res) {
    try {
      const {
        status, signature, challenge,
      } = req.body;
      const { author, scope } = req.params;
      if (!scope) return res.status(400).send('Missing required field scope');
      if (!status) return res.status(400).send('Missing required field status');
      if (Object.values(CONSENT_STATES).indexOf(status) === -1) {
        return res.status(400).send(`Unknown status ${status}`);
      }
      const existing = await Consent.findOne({ where: { author, scope }, raw: true });
      if (existing) {
        await Consent.update({
          status,
          signature,
          challenge,
        }, { where: { author, scope } });
      } else {
        await Consent.create({
          scope,
          status,
          author,
          signature,
          challenge,
        });
      }
      return res.send(await Consent.findOne({ where: { author, scope }, raw: true }));
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  static async removeItem(req, res) {
    const result = await Consent.destroy({
      where: {
        author: req.params.author,
        scope: req.params.scope,
      },
    });
    return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
  }

  static async getAllItemsForUser(req, res) {
    const { author } = req.params;
    res.send(await Consent.findAll({ where: { author } }) || []);
  }

  static async getSingleItem(req, res) {
    const { author, scope } = req.params;
    const result = await Consent.findOne({ where: { author, scope } });
    return result ? res.send(result.toJSON()) : res.sendStatus(404);
  }
};
