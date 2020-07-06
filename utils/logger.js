const fs = require('fs');
const path = require('path');

module.exports = class Logger {
  constructor(_service) {
    this.service = _service;
  }

  log(message) {
    const logMessage = this.prepareMessage(message);
    // eslint-disable-next-line no-console
    console.log(logMessage);
    fs.appendFileSync(path.resolve(`./logs/${new Date().toISOString().substring(0, 10)}.log`), `${JSON.stringify(logMessage)}\n`);
  }

  error(message) {
    let logMessage = this.prepareMessage(message, true);
    if (message.stack && message.message) logMessage = this.prepareMessage({ message: message.message, stack: message.stack }, true);
    // eslint-disable-next-line no-console
    console.error(logMessage);
    fs.appendFileSync(path.resolve(`./logs/${new Date().toISOString().substring(0, 10)}.log`), `${JSON.stringify(logMessage)}\n`);
  }

  prepareMessage(message, err = false) {
    return {
      msg: message,
      service: this.service,
      date: (new Date()).toISOString(),
      level: err ? 'err' : 'info',
    };
  }
};
