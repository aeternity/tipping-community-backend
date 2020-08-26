const fs = require('fs');
const path = require('path');

module.exports = class Logger {
  static log(message) {
    const logMessage = Logger.prepareMessage(message);
    // eslint-disable-next-line no-console
    console.log(logMessage);
    fs.appendFileSync(path.resolve(`./logs/${new Date().toISOString().substring(0, 10)}.log`), `${JSON.stringify(logMessage)}\n`);
  }

  static error(message) {
    let logMessage = Logger.prepareMessage(message, true);
    if (message.stack && message.message) logMessage = Logger.prepareMessage({ message: message.message, stack: message.stack }, true);
    // eslint-disable-next-line no-console
    console.error(logMessage);
    fs.appendFileSync(path.resolve(`./logs/${new Date().toISOString().substring(0, 10)}.log`), `${JSON.stringify(logMessage)}\n`);
  }

  static prepareMessage(message, err = false) {
    return {
      msg: message,
      date: (new Date()).toISOString(),
      level: err ? 'err' : 'info',
    };
  }
};
