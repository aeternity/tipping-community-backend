const fs = require('fs');
const path = require('path');

module.exports = class Logger {

  service = null;

  constructor (_service) {
    this.service = _service;
  }

  log (message) {
    message.date = (new Date).toISOString();
    message.service = this.service;
    const jsonString = JSON.stringify(message);
    console.log(jsonString);
    fs.appendFileSync(path.resolve(`./logs/${new Date().toISOString().substring(0, 10)}.log`), jsonString + '\n');
  }

};

