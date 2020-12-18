const axios = require('axios');
const logger = require('../../../utils/logger')(module);

const LIMIT = 100; // max 1000
const knownHashes = {};

module.exports = class MdwLogic {
  // fetches pages forwards, if no next its the last page, don't cache that
  static async iterateMdw(next, abortIfHashKnown = false) {
    const url = `${process.env.MIDDLEWARE_URL}/${next}`;

    const result = await axios.get(url).then(res => res.data);

    if (abortIfHashKnown && result.data.some(tx => knownHashes[tx.hash])) return result.data.filter(tx => !knownHashes[tx.hash]);

    if (result.next) {
      return result.data.concat(await this.iterateMdw(result.next, abortIfHashKnown));
    }
    return result.data;
  }

  static async middlewareContractTransactions(height) {
    const fetchNonCachedForContract = async contract => {
      // only get all transactions forwards if none are fetched before
      if (Object.keys(knownHashes).length === 0) {
        const txsForward = await this.iterateMdw(`txs/gen/0-${height - 20}?contract=${contract}&type=contract_call&limit=${LIMIT}`);
        txsForward.forEach(tx => {
          knownHashes[tx.hash] = tx;
        });
      }

      // get transactions backwards, abort if we already know any
      const txsBackward = await this.iterateMdw(`txs/backward?contract=${contract}&type=contract_call&limit=${LIMIT}`, true);

      // cache everything but the latest 100 transactions (in case of forks)
      if (txsBackward.length >= (LIMIT - 1)) {
        txsBackward.splice((LIMIT - 1), txsBackward.length).forEach(tx => {
          knownHashes[tx.hash] = tx;
        });
        return txsBackward.splice(0, (LIMIT - 1));
      }

      return [];
    };

    const nonCached = await fetchNonCachedForContract(process.env.CONTRACT_V1_ADDRESS);
    if (process.env.CONTRACT_V2_ADDRESS) {
      return Object.values(knownHashes)
        .concat(nonCached)
        .concat(await fetchNonCachedForContract(process.env.CONTRACT_V2_ADDRESS));
    }

    return Object.values(knownHashes).concat(nonCached);
  }

  static async getChainNames() {
    const result = await this.iterateMdw(`names/active?limit=${LIMIT}`).catch(logger.error);
    return result
      .filter(chainName => !chainName.info.pointers || !chainName.info.pointers.account_pubkey)
      .reduce((acc, chainName) => {
        const pubkey = chainName.info.pointers.account_pubkey;

        acc[pubkey] = acc[pubkey] || [];
        acc[pubkey].push(chainName.name);
        acc[pubkey].sort((name1, name2) => {
          // shorter always replaces
          const lengthDiff = name1.length - name2.length;
          if (lengthDiff !== 0) return lengthDiff;
          // equal length replaces if alphabetically earlier
          return name1.localeCompare(name2);
        });
        return acc;
      }, {});
  }
};
