const { BigNumber } = require('bignumber.js');
const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk');
const fs = require('fs');

class Aeternity {
  constructor () {
    this.init();
  }

  init = async () => {
    if (!this.client) {
      this.client = await Universal({
        nodes: [
          {
            name: 'mainnetNode',
            instance: await Node({
              url: process.env.NODE_URL,
              internalUrl: process.env.NODE_URL,
            }),
          }],
        accounts: [
          MemoryAccount({ keypair: { secretKey: process.env.PRIVATE_KEY, publicKey: process.env.PUBLIC_KEY } }),
        ],
        address: process.env.PUBLIC_KEY,
        networkId: 'ae_mainnet',
        compilerUrl: process.env.COMPILER_URL,
      });
      this.contract = await this.client.getContractInstance(this.getContractSource(), { contractAddress: process.env.CONTRACT_ADDRESS });
      this.oracleContract = await this.client.getContractInstance(this.getOracleContractSource(), { contractAddress: "ct_23bfFKQ1vuLeMxyJuCrMHiaGg5wc7bAobKNuDadf8tVZUisKWs" });
    }
  };

  getTips = async () => {
    if (!this.client) throw new Error('Init sdk first');
    const state = await this.contract.methods.get_state();
    return this.getTipsRetips(state.decodedResult).tips;
  };

  getContractSource = () => {
    if (!process.env.CONTRACT_FILE) throw new Error(`env.CONTRACT_FILE is ${process.env.CONTRACT_FILE}`);
    return fs.readFileSync(`${__dirname}/${process.env.CONTRACT_FILE}.aes`, 'utf-8');
  };

  getOracleContractSource = () => {
    return fs.readFileSync(`${__dirname}/OracleServiceInterface.aes`, 'utf-8');
  };

  async preClaim (address, url) {
    return new Promise((resolve, reject) => {
      // Run preclaim
      this.oracleContract.methods.estimate_query_fee().then(fee => {
        this.contract.methods.pre_claim(url, address, {amount: fee.decodedResult}).then(() => {
          // check claim every second, 20 times
          let intervalCounter = 0;
          const interval = setInterval(async () => {
            if ((await this.contract.methods.check_claim(url, address).decodedResult.success)) {
              clearInterval(interval);
              return resolve();
            }
            if (intervalCounter++ > 30) {
              clearInterval(interval);
              reject();
            }
          }, 2000);
        });
      });
    }).catch(e => console.error(e));
  }

  async claimTips (address, url) {
    await this.preClaim(address, url);
    const result = await this.contract.methods.claim(url, address, false);
    return result.decodedResult;
  };

  getAddressFromChainName = async (names) => {
    return (await Promise.all(names.map(async n => {
      try {
        const queryResult = await this.client.aensQuery(n);
        return queryResult.pointers.length > 0 ? queryResult.pointers[0].id : null;
      } catch (err) {
        if (err.message.includes('failed with 404: Name not found')) {
          return null;
        } else throw new Error(err);
      }
    }))).filter(value => !!value);
  };

  getTipsRetips = (state) => {
    const findUrl = (urlId) => state.urls.find(([_, id]) => urlId === id)[0];

    const findClaimGen = (tipClaimGen, urlId) => {
      const [_, data] = state.claims.find(([id, _]) => id === urlId);

      return {
        unclaimed: tipClaimGen > data[0],
        claim_gen: data[0],
        unclaimed_amount: data[1],
      };
    };

    const findRetips = (tipId, urlId) => state.retips.filter(([_, data]) => data.tip_id === tipId).map(([id, data]) => {
      data.id = id;
      data.claim = findClaimGen(data.claim_gen, urlId);
      return data;
    });

    const tips = state.tips.map(([id, data]) => {
      data.id = id;
      data.url = findUrl(data.url_id);
      data.retips = findRetips(id, data.url_id);
      data.claim = findClaimGen(data.claim_gen, data.url_id);

      data.total_amount = new BigNumber(data.amount).plus(data.retips.reduce((acc, retip) => {
        return acc.plus(retip.amount);
      }, new BigNumber('0'))).toFixed();

      data.total_unclaimed_amount = new BigNumber(data.claim.unclaimed ? data.amount : 0).plus(data.retips.reduce((acc, retip) => {
        return acc.plus(retip.claim.unclaimed ? retip.amount : 0);
      }, new BigNumber('0'))).toFixed();

      return data;
    });

    const urls = state.urls.map(([url, id]) => {
      const urlTips = tips.filter(tip => tip.url_id === id);
      const claim = state.claims.find(([urlId, _]) => urlId === id)[1];

      return {
        id: id,
        url: url,
        tip_ids: urlTips.map(tip => tip.id),
        retip_ids: urlTips.flatMap(tip => tip.retips.map(retip => retip.id)),
        unclaimed_amount: claim[1],
      };
    });

    return {
      urls: urls,
      tips: tips,
    };
  };

}

const ae = new Aeternity();
module.exports = ae;
