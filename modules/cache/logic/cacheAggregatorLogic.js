const cache = require('../utils/cache');
const CacheLogic = require('./cacheLogic');
const LinkPreviewLogic = require('../../linkPreview/logic/linkPreviewLogic');
const CommentLogic = require('../../comment/logic/commentLogic');
const BlacklistLogic = require('../../blacklist/logic/blacklistLogic');
const tipLogic = require('../../tip/logic/tipLogic');
const TipOrderLogic = require('../../tip/logic/tiporderLogic');
const ProfileLogic = require('../../profile/logic/profileLogic');

class CacheAggregatorLogic {
  async getAllTips(blacklist = true) {
    const keys = ['CacheLogic.getAllTips'].concat(blacklist ? ['blacklisted'] : ['all']);
    return cache.getOrSet(keys, async () => {
      const [allTips, tipsPreview, chainNames, commentCounts, blacklistedIds, localTips, profiles] = await Promise.all([
        CacheLogic.getTips(), LinkPreviewLogic.fetchAllLinkPreviews(), CacheLogic.fetchChainNames(),
        CommentLogic.fetchCommentCountForTips(), BlacklistLogic.getBlacklistedIds(), tipLogic.fetchAllLocalTips(), ProfileLogic.getAllProfiles(),
      ]);

      let tips = allTips;

      // filter by blacklisted from backend
      if (blacklist && blacklistedIds) {
        tips = tips.filter(tip => !blacklistedIds.includes(tip.id));
      }

      // add preview to tips from backend
      if (tipsPreview) {
        tips = tips.map(tip => {
          const preview = tipsPreview.find(linkPreview => linkPreview.requestUrl === tip.url);
          return { ...tip, preview };
        });
      }

      // add language to tips from backend
      if (localTips) {
        tips = tips.map(tip => {
          const result = localTips.find(localTip => localTip.id === tip.id);
          return { ...tip, contentLanguage: result ? result.language : null };
        });
      }

      // add chain names for each tip sender
      if (chainNames) {
        tips = tips.map(tip => {
          const currentProfile = profiles.find(profile => profile.author === tip.sender);
          if (currentProfile && currentProfile.preferredChainName) return ({ ...tip, chainName: currentProfile.preferredChainName });
          return ({ ...tip, chainName: chainNames[tip.sender] ? chainNames[tip.sender][0] : undefined });
        });
      }

      // add comment count to each tip
      if (commentCounts) {
        tips = tips.map(tip => {
          const result = commentCounts.find(comment => comment.tipId === tip.id);
          return { ...tip, commentCount: result ? result.count : 0 };
        });
      }

      // add score to tips
      tips = TipOrderLogic.applyTipScoring(tips);

      return tips;
    }, cache.shortCacheTime);
  }
}

const cacheAggregatorLogic = new CacheAggregatorLogic();

module.exports = cacheAggregatorLogic;
