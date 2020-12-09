const MESSAGE_QUEUES = {
  CACHE: 'CACHE',
  TIPS: 'TIPS',
  RETIPS: 'RETIPS',
  LINKPREVIEW: 'LINKPREVIEW',
};

if (process.env.NODE_ENV === 'test') {
  MESSAGE_QUEUES.TEST = 'TEST';
  MESSAGE_QUEUES.TEST_2 = 'TEST_2';
}

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

if (process.env.NODE_ENV === 'test') {
  MESSAGES.TEST = {
    COMMANDS: {
      TEST_COMMAND: 'TEST.COMMANDS.TEST_COMMAND',
      TEST_COMMAND_2: 'TEST.COMMANDS.TEST_COMMAND_2',
    },
    EVENTS: {
      TEST_EVENT: 'TEST.EVENTS.TEST_EVENT',
    },
  };
  MESSAGES.TEST_2 = {
    COMMANDS: {
      TEST_COMMAND: 'TEST_2.COMMANDS.TEST_COMMAND',
    },
    EVENTS: {
      TEST_EVENT: 'TEST_2.EVENTS.TEST_EVENT',
    },
  };
}

module.exports = {
  MESSAGE_QUEUES,
  MESSAGES,
};
