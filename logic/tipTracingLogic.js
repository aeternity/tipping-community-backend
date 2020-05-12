const aeternity = require("../utils/aeternity");
const cache = require("../utils/cache");

module.exports = class TipTracing {

  static async fetchBlockchainTrace(req, res) {
    // TODO optimize query passing
    if (!req.query.id) throw Error("tip id parameter missing")
    const tipId = parseInt(req.query.id);

    // TODO optimize client/cache init
    await aeternity.init();
    await cache.init(aeternity, () => {});
    aeternity.setCache(cache)

    const tip = await aeternity.getTips().then(ts => ts.find(t => t.id === tipId));
    const tips = await aeternity.getTips().then(ts => ts.filter(t => t.url === tip.url));

    const oracle = await aeternity.oracleContract.methods.get_state().then(x => x.decodedResult);
    const oracleClaim = oracle.success_claimed_urls.find(([url, _]) => url === tip.url)[1];
    // TODO more info regarding oracle claim from new getter function
    // TODO more details from oracle contract from contract events

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
