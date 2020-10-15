const axios = require('axios');
const cache = require('../utils/cache');
const logger = require('../utils/logger')(module);

const LIMIT = 100;

module.exports = class MdwLogic {

  // fetches pages forwards, if no next its the last page, don't cache that
  static async iterateMdw(next) {
    const url = `${process.env.MIDDLEWARE_URL}/${next}`

    const fromCache = await cache.get(['iterateMdw', LIMIT, url]);
    const result = fromCache || await axios.get(url).then(res => res.data);

    if (result.next) {
      if (!fromCache) await cache.set(['iterateMdw', LIMIT, url], result);
      return result.data.concat(await this.iterateMdw(result.next));
    }
    return result.data;
  }

  static async middlewareContractTransactions() {
    const buildUrl = (contractAddress) => `txs/forward/and?contract=${contractAddress}&type=contract_call&limit=${LIMIT}`

    const oldContractTransactionsPromise = this.iterateMdw(buildUrl(process.env.CONTRACT_V1_ADDRESS));
    if (process.env.CONTRACT_V2_ADDRESS) {
      const contractTransactionsPromise = this.iterateMdw(buildUrl(process.env.CONTRACT_V2_ADDRESS));
      return Promise.all([oldContractTransactionsPromise, contractTransactionsPromise])
        .then(([oldContractTransactions, contractTransactions]) => oldContractTransactions.concat(contractTransactions));
    }
    return oldContractTransactionsPromise;
  }

  static async getChainNames() {
    return this.iterateMdw(`names/active?limit=${LIMIT}`).catch(logger.error);
  }

};
