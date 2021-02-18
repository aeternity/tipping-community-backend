const { Profile } = require('../../../models');

const ACTIONS = [
  {
    method: 'GET',
    path: '/notification/user/ak_',
    actionName: 'GET_NOTIFICATIONS',
    relevantFields: ['author'],
  },
  {
    method: 'GET',
    path: '/consent/ak_',
    actionName: 'GET_CONSENT',
    relevantFields: ['author'],
  },
  {
    method: 'POST',
    path: '/comment/api/?',
    actionName: 'CREATE_COMMENT',
    relevantFields: ['text', 'tipId', 'author', 'parentId'],
  },
  {
    method: 'POST',
    path: '/consent/ak_',
    actionName: 'CREATE_CONSENT',
    relevantFields: ['author', 'scope', 'status'],
  },
  {
    method: 'POST',
    path: /\/notification\/\d+/,
    actionName: 'MODIFY_NOTIFICATION',
    relevantFields: ['author', 'status'],
  },
  {
    method: 'POST',
    path: /\/notification\/?$/,
    actionName: 'MODIFY_NOTIFICATION',
    relevantFields: ['author', 'status', 'ids'],
  },
  {
    method: 'POST',
    path: '/profile/?$',
    actionName: 'CREATE_PROFILE',
    relevantFields: ['author', 'biography', 'preferredChainName', 'image', 'referrer', 'coverImage', 'location'],
    getFullEntry: async req => Profile.findOne({ where: { author: req.body.author }, raw: true }),
  },
  {
    method: 'POST',
    path: '/profile/ak_',
    actionName: 'UPDATE_PROFILE',
    relevantFields: ['author', 'biography', 'preferredChainName', 'image', 'referrer', 'coverImage', 'location'],
    getFullEntry: async req => Profile.findOne({ where: { author: req.params.author }, raw: true }),
  },
  {
    method: 'POST',
    path: '/profile/image/ak_',
    actionName: 'CREATE_PROFILE',
    relevantFields: ['author', 'biography', 'preferredChainName', 'image', 'referrer', 'coverImage', 'location'],
    getFullEntry: async req => Profile.findOne({ where: { author: req.params.author }, raw: true }),
  },
  {
    method: 'POST',
    path: '/blacklist/api/wallet',
    actionName: 'CREATE_FLAGGED_TIP',
    relevantFields: ['tipId', 'author'],
  },
  {
    method: 'POST',
    path: '/pin/ak_',
    actionName: 'CREATE_PIN',
    relevantFields: ['author', 'entryId', 'type'],
  },
  {
    method: 'DELETE',
    path: '/pin/ak_',
    actionName: 'DELETE_PIN',
    relevantFields: ['author', 'entryId', 'type'],
  },
  {
    method: 'DELETE',
    path: '/comment/api/.*',
    actionName: 'DELETE_COMMENT',
    relevantFields: ['author'],
  },
  {
    method: 'DELETE',
    path: '/consent/ak_.*',
    actionName: 'DELETE_PROFILE',
    relevantFields: [],
  },
  {
    method: 'DELETE',
    path: '/profile/ak_.*',
    actionName: 'DELETE_PROFILE',
    relevantFields: [],
  },
  {
    method: 'DELETE',
    path: '/profile/image/ak_.*',
    actionName: 'DELETE_PROFILE_IMAGE',
    relevantFields: [],
  }];

module.exports = ACTIONS;
