import CacheLogic from "../../cache/logic/cacheLogic.js";
import models from "../../../models/index.js";
import { BLACKLIST_STATUS } from "../constants/blacklistStates.js";

const { BlacklistEntry } = models;
const BlacklistLogic = {
  async augmentAllItems(allItems) {
    const blacklist = await BlacklistEntry.findAll({
      raw: true,
    });
    return allItems
      .map((item) => ({
        ...item,
        hidden: blacklist.some((b) => b.tipId === item.id && b.status === BLACKLIST_STATUS.HIDDEN),
        flagged: blacklist.some((b) => b.tipId === item.id && b.status === BLACKLIST_STATUS.FLAGGED),
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  },
  async resetCache() {
    await CacheLogic.invalidateStatsCache();
  },
  async addItem(tipId) {
    const entry = await BlacklistEntry.create({ tipId: String(tipId) });
    await BlacklistLogic.resetCache();
    return entry;
  },
  async flagTip(tipId, author, signature, challenge) {
    let entry = await BlacklistEntry.findOne({ where: { tipId }, raw: true });
    if (!entry) {
      entry = await BlacklistEntry.create({
        tipId,
        author,
        signature,
        challenge,
        status: BLACKLIST_STATUS.FLAGGED,
      });
      // Kill stats cache
      await BlacklistLogic.resetCache();
    }
    return entry;
  },
  async updateItem(tipId, status) {
    await BlacklistEntry.update({ status }, { where: { tipId } });
    await BlacklistLogic.resetCache();
  },
  async removeItem(tipId) {
    const result = await BlacklistEntry.destroy({
      where: {
        tipId,
      },
    });
    await BlacklistLogic.resetCache();
    return result;
  },
  async getBlacklistedIds() {
    const blacklist = await BlacklistEntry.findAll({ raw: true, where: { status: BLACKLIST_STATUS.HIDDEN } });
    return blacklist.map((b) => b.tipId);
  },
};
export default BlacklistLogic;
