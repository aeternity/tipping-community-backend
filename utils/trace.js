const {v4: uuidv4} = require('uuid');
const fs = require('fs');
const {Trace: TraceModel} = require('../models');

module.exports = class Trace {

  constructor() {
    this.id = uuidv4();
    this.data = [];
    this.writeToJSON();
  }

  update(update) {
    console.log('UPDATE TRACE', this.id, update);
    this.data.push(Object.assign(update, {date: Date.now()}));
    this.writeToJSON();
  }

  setMetaData(url, publicKey) {
    TraceModel.create({
      url,
      publicKey,
      uuid: this.id,
    });
  }

  writeToJSON() {
    fs.writeFileSync(`./traces/${this.id}.json`, JSON.stringify(this.data));
  }

  catchError(returnValue) {
    return (e) => {
      this.update({state: Trace.state.CAUGHT_ERROR, error: Object.assign({}, e)});
      return returnValue;
    };
  }

  finished(result) {
    this.update(Object.assign({state: Trace.state.FINISHED}, result));
    this.writeToJSON();
    console.log('TRACE', this.id);
    console.log(this.data);
  }

  removeFile() {
    fs.unlinkSync(`./traces/${this.id}.json`);
  }

  static state = {
    REQUEST_RECEIVED: 'REQUEST_RECEIVED',
    BODY_RECEIVED: 'BODY_RECEIVED',
    DATA_PARSED: 'DATA_PARSED',
    CLAIM_AMOUNT: 'CLAIM_AMOUNT',
    INITIAL_PRECLAIM_RESULT: 'INITIAL_PRECLAIM_RESULT',
    ESTIMATED_FEE: 'ESTIMATED_FEE',
    PRECLAIM_STARTED: 'PRECLAIM_STARTED',
    STARTED_PRE_CLAIM: 'STARTED_PRE_CLAIM',
    CAUGHT_ERROR: 'CAUGHT_ERROR',
    REQUEST_ANSWERED: 'REQUEST_ANSWERED',
    FINAL_PRECLAIM_RESULT: 'FINAL_PRECLAIM_RESULT',
    CLAIM_RESULT: 'CLAIM_RESULT',
    ERROR: 'ERROR',
    FINISHED: 'FINISHED',
  };
};
