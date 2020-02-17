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
    }
  };

  callContract = async () => {
    if (!this.client) throw new Error('Init sdk first');
    const tips = await this.contract.methods.get_state();
    return tips.decodedResult.tips;
  };

  getContractSource = () => {
    if (!process.env.CONTRACT_FILE) throw new Error(`env.CONTRACT_FILE is ${process.env.CONTRACT_FILE}`);
    return fs.readFileSync(`${__dirname}/${process.env.CONTRACT_FILE}.aes`, 'utf-8');
  };

  async claimTips (address, url) {
    const tips = await this.contract.methods.tips_for_url(url);
    if (tips.decodedResult && tips.decodedResult.length > 0) {
      if (tips.decodedResult.every(tip => tip.repaid)) throw new Error('All tips are claimed');
      const result = await this.contract.methods.claim(url, address);
      return result.decodedResult;
    } else {
      throw new Error('No tips for url');
    }
  };

  getAddressFromChainName = async (names) => {
    return Promise.all(names.map(async n => (await this.client.aensQuery(n)).pointers[0].id));
  };

}

const ae = new Aeternity();
module.exports = ae;
