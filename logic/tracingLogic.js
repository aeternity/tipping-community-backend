const { v4: uuidv4 } = require('uuid');

module.exports = class TracingLogic {

  constructor () {
    this.id = uuidv4();
    // TODO create new entry
    this.data = [];
  }

  update (update) {
    console.log('UPDATE TRACE', this.id, update)
    this.data.push(Object.assign(update, { date: new Date() }));
  }

  catchError (returnValue) {
    return (e) => {
      this.update({ state: TracingLogic.state.CAUGHT_ERROR, error: Object.assign({}, e) });
      return returnValue
    }
  }

  finished (result) {
    this.update(Object.assign({ state: TracingLogic.state.FINISHED }, result));
    console.log('TRACE', this.id);
    console.log(this.data);
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
