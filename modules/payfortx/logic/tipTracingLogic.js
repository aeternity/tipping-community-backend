import fs from "fs";
import path from "path";
import aeternity from "../../aeternity/logic/aeternity.js";
import models from "../../../models/index.js";
import TipLogic from "../../tip/logic/tipLogic.js";
import StatsLogic from "../../stats/logic/statsLogic.js";
import EventLogic from "../../event/logic/eventLogic.js";

const { Trace } = models;
export default (class TipTracing {
  static async getAllTraces(req, res) {
    if (!req.query.id) return res.status(400).send("tip id parameter missing");
    const tipId = req.query.id;
    const tip = await TipLogic.fetchTip(tipId);
    if (!tip) return res.status(404).send("tip not found");
    const readFile = (uuid) => {
      const traceFolder = path.resolve("./traces/");
      try {
        return JSON.parse(fs.readFileSync(`${traceFolder}/${uuid}.json`, "utf-8"));
      } catch (e) {
        return [];
      }
    };
    const allTracesDB = await Trace.findAll({ where: { url: tip.url }, raw: true });
    const allTraces = allTracesDB.reduce((acc, trace) => {
      acc.push(readFile(trace.uuid));
      return acc;
    }, []);
    return res.send(allTraces);
  }

  static async fetchBlockchainTrace(req, res) {
    if (!req.query.id) throw Error("tip id parameter missing");
    const tipId = req.query.id;
    const tip = await TipLogic.fetchTip(tipId);
    const urlStats = await StatsLogic.urlStats(tip.url);
    const oracleClaim = await aeternity.fetchOracleClaimByUrl(tip.url);
    const unsafeCheckOracleAnswers = await aeternity.getUnsafeOracleAnswersForUrl(tip.url);
    const events = await EventLogic.getEventsForURL(tip.url);
    const result = {
      tip,
      urlStats,
      urlOracleClaim: oracleClaim,
      urlEvents: events,
      urlIntermediateOracleAnswers: unsafeCheckOracleAnswers,
    };
    res.send(result);
  }
});
