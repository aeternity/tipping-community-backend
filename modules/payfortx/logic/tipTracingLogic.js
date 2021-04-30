const fs = require('fs');
const path = require('path');
const aeternity = require('../../aeternity/logic/aeternity');
const { Trace: TraceModel } = require('../../../models');
const TipLogic = require('../../tip/logic/tipLogic');
const StatsLogic = require('../../stats/logic/statsLogic');
const EventLogic = require('../../event/logic/eventLogic');

module.exports = class TipTracing {
  static async getAllTraces(req, res) {
    if (!req.query.id) return res.status(400).send('tip id parameter missing');
    const tipId = req.query.id;
    const tip = await TipLogic.fetchTip(tipId);
    if (!tip) return res.status(404).send('tip not found');

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
    const tipId = req.query.id;

    const tip = await TipLogic.fetchTip(tipId);
    const urlStats = await StatsLogic.urlStats(tip.url);

    // Deliberately not cached
    const oracleClaim = await aeternity.fetchOracleClaimByUrl(tip.url);
    const unsafeCheckOracleAnswers = await aeternity.getUnsafeOracleAnswersForUrl(tip.url);

    // Deliberately not cached
    const events = await EventLogic.getEventsForURL(tip.url);

    const result = {
      tip,
      urlStats: urlStats,
      urlOracleClaim: oracleClaim,
      urlEvents: events,
      urlIntermediateOracleAnswers: unsafeCheckOracleAnswers,
    };

    res.send(result);
  }
};
