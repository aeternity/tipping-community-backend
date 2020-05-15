const aeternity = require("../utils/aeternity");
const { Trace: TraceModel } = require('../models');
const fs = require('fs');
const path = require('path');

module.exports = class TipTracing {

  static async getAllTraces (req, res) {
    const readFile = (uuid) => {
      const traceFolder = path.resolve(`./traces/`);
      try {
        return JSON.parse(fs.readFileSync(`${traceFolder}/${uuid}.json`, 'utf-8'))
      } catch(e) {
        return []
      }
    }

    const allTracesDB = await TraceModel.findAll({ raw: true });
    const allTraces = allTracesDB.reduce((acc, trace) => acc.push(readFile(trace.uuid)), []);
    res.send(allTraces);
  }

  static async fetchBlockchainTrace(req, res) {
    if (!req.query.id) throw Error("tip id parameter missing")
    const tipId = parseInt(req.query.id);

    const tip = await aeternity.getTips().then(ts => ts.find(t => t.id === tipId));
    const tips = await aeternity.getTips().then(ts => ts.filter(t => t.url === tip.url));

    const oracle = await aeternity.oracleContract.methods.get_state().then(x => x.decodedResult);
    const oracleClaim = oracle.success_claimed_urls.find(([url, _]) => url === tip.url)[1];
    // TODO more info regarding oracle claim from new getter function

    const contractTransactions = await aeternity.middlewareContractTransactions()
    const events = await contractTransactions.map(tx => tx.hash)
      .asyncMap(aeternity.transactionEvents)
      .then(events => events.filter(e => e.url === tip.url));

    const result = {
      tip: tip,
      url_tips: tips,
      url_oracle_claim: oracleClaim,
      url_events: events
    }

    res.send(result);
  }
};
