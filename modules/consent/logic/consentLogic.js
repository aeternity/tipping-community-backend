const { Consent } = require('../../../models');

module.exports = class ConsentLogic {
  static async upsertItem({
    status, author, scope, signature, challenge,
  }) {
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
    return Consent.findOne({ where: { author, scope }, raw: true });
  }

  static async removeItem(author, scope) {
    return Consent.destroy({
      where: {
        author,
        scope,
      },
    });
  }

  static async getAllItemsForUser(address) {
    return Consent.findAll({ where: { author: address } }) || [];
  }

  static async getSingleItem(author, scope) {
    return Consent.findOne({ where: { author, scope } });
  }
};
