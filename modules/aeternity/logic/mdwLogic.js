const axios = require('axios');
const Sentry = require('@sentry/node');
const AsyncLock = require('async-lock');

const logger = require('../../../utils/logger')(module);
const aeternity = require('./aeternity');
const { ChainName, sequelize } = require('../../../models');

const lock = new AsyncLock();

const LIMIT = 100; // max 1000

if (!process.env.MIDDLEWARE_URL) throw new Error('Env MIDDLEWARE_URL is not defined');
if (process.env.MIDDLEWARE_URL.match(/\/$/)) throw new Error('MIDDLEWARE_URL can not end with a trailing slash');

const MdwLogic = {
   init() {
     setInterval(() => this.updateChainNamesDB(), 10 * 60 * 1000);
   },

  // fetches pages forwards, if no next its the last page, don't cache that
  async iterateMdw(contract, next, abortIfHashKnown = false) {
    const url = `${process.env.MIDDLEWARE_URL}/${next}`;
    const result = await axios.get(url, { timeout: 10000 }).then(res => res.data);

    if (result.next) {
      return result.data.concat(await MdwLogic.iterateMdw(contract, result.next, abortIfHashKnown));
    }
    return result.data;
  },

  async getContractTransactions(upperHeight, lowerHeight, contract) {
    return MdwLogic.iterateMdw(contract, `txs/gen/${upperHeight}-${lowerHeight}?contract=${contract}&type=contract_call&limit=${LIMIT}`, true);
  },

  async middlewareContractTransactions(upperHeight, lowerHeight) {
    try {
      const result = await MdwLogic.getContractTransactions(upperHeight, lowerHeight, process.env.CONTRACT_V1_ADDRESS);
      if (process.env.CONTRACT_V2_ADDRESS) {
        result.unshift(...await MdwLogic.getContractTransactions(upperHeight, lowerHeight, process.env.CONTRACT_V2_ADDRESS));
      }
      if (process.env.CONTRACT_V3_ADDRESS) {
        result.unshift(...await MdwLogic.getContractTransactions(upperHeight, lowerHeight, process.env.CONTRACT_V3_ADDRESS));
      }
      return result.reduce((acc, tx) => [
        ...acc,
        ...aeternity.decodeTransactionEvents(tx),
      ], []);
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
      .filter(chainName => chainName.info.pointers && chainName.info.pointers.account_pubkey)
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

   async updateChainNamesDB() {
     await lock.acquire('MdwLogic.updateChainNamesDB', async () => {
       const result = await this.getChainNames().then((res) => Object.entries(res).map(([publicKey, chainNames]) => {
         return { publicKey, name: chainNames[0] };
       }));

       const transaction = await sequelize.transaction()
       await ChainName.truncate({ transaction });
       await ChainName.bulkCreate(result, { transaction });
       await transaction.commit();
     });
   },
}

module.exports = MdwLogic;
