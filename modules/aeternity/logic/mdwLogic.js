const axios = require('axios');
const Sentry = require('@sentry/node');
const logger = require('../../../utils/logger')(module);

const LIMIT = 100; // max 1000
const knownHashes = {};

if (process.env.MIDDLEWARE_URL.match(/\/$/)) throw new Error('MDW URL can not end with a trailing slash');

module.exports = class MdwLogic {
  // fetches pages forwards, if no next its the last page, don't cache that
  static async iterateMdw(contract, next, abortIfHashKnown = false) {
    const url = `${process.env.MIDDLEWARE_URL}/${next}`;

    const result = await axios.get(url, { timeout: 10000 }).then(res => res.data);

    if (abortIfHashKnown && result.data.some(tx => knownHashes[contract][tx.hash])) return result.data.filter(tx => !knownHashes[contract][tx.hash]);

    if (result.next) {
      return result.data.concat(await this.iterateMdw(contract, result.next, abortIfHashKnown));
    }
    return result.data;
  }

  static async middlewareContractTransactions(height) {
    const fetchNonCachedForContract = async contract => {
      // only get all transactions forwards if none are fetched before
      if (!knownHashes[contract]) knownHashes[contract] = [];
      if (Object.keys(knownHashes[contract]).length === 0) {
        const txsForward = await this.iterateMdw(contract, `txs/gen/0-${height - 20}?contract=${contract}&type=contract_call&limit=${LIMIT}`);
        txsForward.forEach(tx => {
          knownHashes[contract][tx.hash] = tx;
        });
      }

      // get transactions backwards, abort if we already know any
      const txsBackward = await this.iterateMdw(contract, `txs/backward?contract=${contract}&type=contract_call&limit=${LIMIT}`, true);

      // cache everything but the latest 100 transactions (in case of forks)
      if (txsBackward.length >= (LIMIT - 1)) {
        txsBackward.splice((LIMIT - 1), txsBackward.length).forEach(tx => {
          knownHashes[contract][tx.hash] = tx;
        });
        return txsBackward.splice(0, (LIMIT - 1));
      }

      return [];
    };

    try {
      const nonCached = await fetchNonCachedForContract(process.env.CONTRACT_V1_ADDRESS);
      const result = Object.values(knownHashes[process.env.CONTRACT_V1_ADDRESS]).concat(nonCached);
      if (process.env.CONTRACT_V2_ADDRESS) {
        result.unshift(...await fetchNonCachedForContract(process.env.CONTRACT_V2_ADDRESS));
        result.unshift(...Object.values(knownHashes[process.env.CONTRACT_V2_ADDRESS]));
      }
      if (process.env.CONTRACT_V3_ADDRESS) {
        result.unshift(...await fetchNonCachedForContract(process.env.CONTRACT_V3_ADDRESS));
        result.unshift(...Object.values(knownHashes[process.env.CONTRACT_V3_ADDRESS]));
      }
      return result;
    } catch (e) {
      logger.error(`Could not fetch events from middleware: ${e.message}`);
      Sentry.captureException(e);
      return [];
    }
  }

  static async getChainNames() {
    return this.iterateMdw(null, `names/active?limit=${LIMIT}`).catch(e => {
      logger.error(`Could not fetch names from middleware: ${e.message}`);
      Sentry.captureException(e);
      return [];
    });
  }
};
