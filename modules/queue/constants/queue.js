const MESSAGE_QUEUES = {
  CACHE: 'CACHE',
  TIPS: 'TIPS',
  RETIPS: 'RETIPS',
  LINKPREVIEW: 'LINKPREVIEW',
};

// TODO verify that events are correctly phrased or build automatic correction tool
const MESSAGES = {
  CACHE: {
    COMMANDS: {
      KEEPHOT: 'CACHE.COMMANDS.KEEPHOT',
    },
    EVENTS: {
      RENEWED_TIPS: 'CACHE.EVENTS.RENEWED_TIPS',
    },
  },
  TIPS: {
    COMMANDS: {
      UPDATE_DB: 'TIPS.COMMANDS.UPDATE_DB',
    },
    EVENTS: {
      CREATED_NEW_LOCAL_TIPS: 'TIPS.EVENTS.CREATED_NEW_LOCAL_TIPS',
    },
  },
  RETIPS: {
    COMMANDS: {
      UPDATE_DB: 'RETIPS.COMMANDS.UPDATE_DB',
    },
  },
  LINKPREVIEW: {
    COMMANDS: {
      UPDATE_DB: 'LINKPREVIEW.COMMANDS.UPDATE_DB',
    },
    EVENTS: {
      CREATED_NEW_PREVIEWS: 'LINKPREVIEW.EVENTS.CREATED_NEW_PREVIEWS',
    },
  },
};

module.exports = {
  MESSAGE_QUEUES,
  MESSAGES,
};
