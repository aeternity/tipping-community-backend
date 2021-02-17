const CacheLogic = require('../../cache/logic/cacheLogic');
const { BlacklistEntry } = require('../../../models');
const { BLACKLIST_STATUS } = require('../constants/blacklistStates');

async function augmentAllItems(allItems) {
  const blacklist = await BlacklistEntry.findAll({
    raw: true,
  });
  return allItems.map(item => ({
    ...item,
    hidden: blacklist.some(b => b.tipId === item.id && b.status === BLACKLIST_STATUS.HIDDEN),
    flagged: blacklist.some(b => b.tipId === item.id && b.status === BLACKLIST_STATUS.FLAGGED),
  })).sort((a, b) => b.timestamp - a.timestamp);
}

async function resetCache() {
  await CacheLogic.invalidateBlacklistedTips();
  await CacheLogic.invalidateStatsCache();
}

async function addItem(tipId) {
  const entry = await BlacklistEntry.create({ tipId: String(tipId) });

  await resetCache();
  return entry;
}

async function flagTip(tipId, author) {
  let entry = await BlacklistEntry.findOne({ where: { tipId }, raw: true });
  if (!entry) {
    entry = await BlacklistEntry.create({ tipId, flagger: author, status: BLACKLIST_STATUS.FLAGGED });
    // Kill stats cache
    await resetCache();
  }
  return entry;
}

async function updateItem(tipId, status) {
  await BlacklistEntry.update({ status }, { where: { tipId } });
  await resetCache();
}

async function removeItem(tipId) {
  const result = await BlacklistEntry.destroy({
    where: {
      tipId,
    },
  });
  await resetCache();
  return result;
}

async function getBlacklistedIds() {
  const blacklist = await BlacklistEntry.findAll({ raw: true, where: { status: BLACKLIST_STATUS.HIDDEN } });
  return blacklist.map(b => b.tipId);
}

module.exports = {
  augmentAllItems,
  addItem,
  flagTip,
  updateItem,
  removeItem,
  getBlacklistedIds,
};
