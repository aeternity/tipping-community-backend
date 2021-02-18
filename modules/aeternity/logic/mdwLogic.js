const axios = require('axios');
const Sentry = require('@sentry/node');
const logger = require('../../../utils/logger')(module);

const LIMIT = 100; // max 1000
const knownHashes = {};

if (process.env.MIDDLEWARE_URL.match(/\/$/)) throw new Error('MDW URL can not end with a trailing slash');

const MdwLogic = {
  // fetches pages forwards, if no next its the last page, don't cache that
  async iterateMdw(contract, next, abortIfHashKnown = false) {
    const url = `${process.env.MIDDLEWARE_URL}/${next}`;

    const result = await axios.get(url, { timeout: 10000 }).then(res => res.data);

    if (abortIfHashKnown && result.data.some(tx => knownHashes[contract][tx.hash])) return result.data.filter(tx => !knownHashes[contract][tx.hash]);

    if (result.next) {
      return result.data.concat(await MdwLogic.iterateMdw(contract, result.next, abortIfHashKnown));
    }
    return result.data;
  },

  async getContractTransactions(height, contract) {
    const nonCached = await MdwLogic.fetchNonCachedForContract(height, contract);
    return Object.values(knownHashes[contract]).concat(nonCached);
  },

  async fetchNonCachedForContract(height, contract) {
    // only get all transactions forwards if none are fetched before
    if (!knownHashes[contract]) knownHashes[contract] = [];
    if (Object.keys(knownHashes[contract]).length === 0) {
      const txsForward = await MdwLogic.iterateMdw(contract, `txs/gen/0-${height - 20}?contract=${contract}&type=contract_call&limit=${LIMIT}`);
      txsForward.forEach(tx => {
        knownHashes[contract][tx.hash] = tx;
      });
    }

    // get transactions backwards, abort if we already know any
    const txsBackward = await MdwLogic.iterateMdw(contract, `txs/backward?contract=${contract}&type=contract_call&limit=${LIMIT}`, true);

    // cache everything but the latest 100 transactions (in case of forks)
    if (txsBackward.length >= (LIMIT - 1)) {
      txsBackward.splice((LIMIT - 1), txsBackward.length).forEach(tx => {
        knownHashes[contract][tx.hash] = tx;
      });
      return txsBackward.splice(0, (LIMIT - 1));
    }

    // if less than 100 return all uncached
    return txsBackward;
  },

  async middlewareContractTransactions(height) {
    try {
      const result = await MdwLogic.getContractTransactions(height, process.env.CONTRACT_V1_ADDRESS);
      if (process.env.CONTRACT_V2_ADDRESS) {
        result.unshift(...await MdwLogic.getContractTransactions(height, process.env.CONTRACT_V2_ADDRESS));
      }
      if (process.env.CONTRACT_V3_ADDRESS) {
        result.unshift(...await MdwLogic.getContractTransactions(height, process.env.CONTRACT_V3_ADDRESS));
      }
      return result;
    } catch (e) {
      logger.error(`Could not fetch events from middleware: ${e.message}`);
      Sentry.captureException(e);
      return [];
    }
  },

  async getChainNames() {
    const result = await MdwLogic.iterateMdw(null, `names/active?limit=${LIMIT}`).catch(e => {
      logger.error(`Could not fetch names from middleware: ${e.message}`);
      Sentry.captureException(e);
      return [];
    });
    return result
      .filter(chainName => !chainName.info.pointers || !chainName.info.pointers.account_pubkey)
      .reduce((acc, chainName) => {
        const pubkey = chainName.info.pointers.account_pubkey;

        acc[pubkey] = acc[pubkey] || [];
        acc[pubkey].push(chainName.name);
        acc[pubkey].sort((name1, name2) => {
          // since shorter names are more expensive, we prefer them here
          const lengthDiff = name1.length - name2.length;
          if (lengthDiff !== 0) return lengthDiff;
          // equal length replaces if alphabetically earlier
          return name1.localeCompare(name2);
        });
        return acc;
      }, {});
  },
};

module.exports = MdwLogic;
