const fs = require('fs');
const path = require('path');
const aeternity = require('../utils/aeternity');
const { Trace: TraceModel } = require('../models');
const CacheLogic = require('./cacheLogic');

module.exports = class TipTracing {
  static async getAllTraces(req, res) {
    if (!req.query.id) return res.status(400).send('tip id parameter missing');
    const tipId = parseInt(req.query.id, 10);
    const tip = await aeternity.getTips().then(ts => ts.find(t => t.id === tipId));

    const readFile = uuid => {
      const traceFolder = path.resolve('./traces/');
      try {
        return JSON.parse(fs.readFileSync(`${traceFolder}/${uuid}.json`, 'utf-8'));
      } catch (e) {
        return [];
      }
    };

    const allTracesDB = await TraceModel.findAll({ where: { url: tip.url }, raw: true });
    const allTraces = allTracesDB.reduce((acc, trace) => {
      acc.push(readFile(trace.uuid));
      return acc;
    }, []);
    return res.send(allTraces);
  }

  static async fetchBlockchainTrace(req, res) {
    if (!req.query.id) throw Error('tip id parameter missing');
    const tipId = parseInt(req.query.id, 10);

    const tip = await aeternity.getTips().then(ts => ts.find(t => t.id === tipId));
    const tips = await aeternity.getTips().then(ts => ts.filter(t => t.url === tip.url));
    const urlStats = CacheLogic.statsForTips(tips);

    const oracle = await aeternity.oracleContract.methods.get_state().then(x => x.decodedResult);
    const oracleClaim = oracle.success_claimed_urls.find(([url]) => url === tip.url);
    const unsafeCheckOracleAnswers = await aeternity.oracleContract.methods.unsafe_check_oracle_answers(tip.url).then(x => x.decodedResult);

    const contractTransactions = await aeternity.middlewareContractTransactions();
    const events = await contractTransactions.map(tx => tx.hash)
      .asyncMap(hash => aeternity.transactionEvents(hash))
      .then(transactionEvents => transactionEvents.filter(e => e.url === tip.url));

    const result = {
      tip,
      url_stats: urlStats,
      url_tips: tips,
      url_oracle_claim: oracleClaim ? oracleClaim[1] : null,
      url_events: events,
      url_intermediate_oracle_answers: unsafeCheckOracleAnswers,
    };

    res.send(result);
  }
};
