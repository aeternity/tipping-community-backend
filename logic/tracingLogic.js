const { v4: uuidv4 } = require('uuid');

module.exports = class TracingLogic {

  constructor() {
    this.id = uuidv4();
    // TODO create new entry
    this.data = []
  }

  update (update) {
    this.data.push(Object.assign(update, {date: new Date()}))
  }

  finished (result) {
    this.update(Object.assign({state: TracingLogic.state.FINISHED}, result))
    console.log("TRACE", this.id)
    console.log(this.data)
  }

  static state = {
    REQUEST_RECEIVED: 'REQUEST_RECEIVED',
    BODY_RECEIVED: 'BODY_RECEIVED',
    DATA_PARSED: 'DATA_PARSED',
    STARTED_PRE_CLAIM: 'STARTED_PRE_CLAIM',
    ERROR: 'ERROR',
    FINISHED: 'FINISHED'
  };
};
