const BigNumber = require('bignumber.js');
const { Comment, Profile } = require('../../../models');
const NotificationLogic = require('../../notification/logic/notificationLogic');
const cache = require('../../cache/utils/cache');
const TipLogic = require('../../tip/logic/tipLogic');
const MdwLogic = require('../../aeternity/logic/mdwLogic');
const { NOTIFICATION_TYPES } = require('../../notification/constants/notification');

const CommentLogic = {
  async addItem(tipId, text, author, signature, challenge, parentId) {
    const parentComment = (typeof parentId !== 'undefined' && parentId !== '')
      ? await Comment.findOne({ where: { id: parentId } }) : null;
    if (parentComment === null && typeof parentId !== 'undefined' && parentId !== '') {
      return {
        error: `Could not find parent comment with id ${parentId}`,
      };
    }

    const relevantTip = await TipLogic.fetchTip(tipId);
    if (!relevantTip) throw new Error(`Could not find tip with id ${tipId}`);
    const parsedTip = relevantTip.toJSON();
    // if ae --> pass
    // check if user has balance in at least one
    if (new BigNumber(parsedTip.aggregation.totalAmount).isZero() && parsedTip.aggregation.totalTokenAmount.length > 0) {
      // get balances for user on all tokens
      const userToken = await MdwLogic.fetchTokenBalancesForAddress(author).catch(() => []);
      const requiredToken = parsedTip.aggregation.totalTokenAmount.map(({ token }) => token);
      if (!userToken.some(({ amount, contract_id: contractId }) => new BigNumber(amount).gt('0') && requiredToken.includes(contractId))) {
        return {
          error: 'The commenting user needs to own at least one token the tip has been tipped or retipped with.',
        };
      }
    }

    const entry = await Comment.create({
      tipId, text, author, signature, challenge, parentId,
    });

    // Kill stats cache
    await cache.del(['StaticLogic.getStats']);

    // Create notification
    await NotificationLogic.add[NOTIFICATION_TYPES.COMMENT_ON_TIP](relevantTip.sender, entry.author, entry.id, relevantTip.id);
    if (parentComment !== null) {
      await NotificationLogic.add[NOTIFICATION_TYPES.COMMENT_ON_COMMENT](parentComment.author, entry.author, entry.id, parentComment.id);
    }
    return entry;
  },

  async removeItem(id) {
    return Comment.destroy({
      where: {
        id,
      },
    });
  },

  async fetchCommentsForAuthor(author) {
    return Comment.findAll({
      where: { author },
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    }).then(comments => comments.map(comment => comment.toJSON()));
  },

  async fetchSingleComment(commentId) {
    return Comment.findOne({
      where: { id: commentId },
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    }).then(result => (result ? result.toJSON() : null));
  },

  async fetchCommentsForTip(tipId) {
    return Comment.findAll({
      where: { tipId },
      include: [{
        model: Comment,
        as: 'descendents',
        hierarchy: true,
      }, Profile],
    }).then(comments => comments.map(comment => comment.toJSON()));
  },

  async updateItem(req, res) {
    const { text, author, hidden } = req.body;
    if (!author) return res.status(400).send({ err: 'Author required' });
    if (!text && !hidden) return res.status(400).send({ err: 'Missing at least one updatable field' });
    await Comment.update({
      ...text && { text },
      ...hidden && { hidden },
    }, { where: { id: req.params.id }, raw: true });
    const result = await Comment.findOne({ where: { id: req.params.id }, raw: true });
    return result ? res.send(result) : res.sendStatus(404);
  },

  async verifyAuthor(req, res, next) {
    if (!req.body.author) return res.status(400).send({ err: 'Author required' });
    const result = await Comment.findOne({ where: { id: req.params.id, author: req.body.author }, raw: true });
    return result ? next() : res.status(404).send({ err: `Could not find comment with id ${req.params.id} and ${req.body.author} as author` });
  },
};

module.exports = CommentLogic;
