const { Universal, Node } = require('@aeternity/aepp-sdk');
const fs = require('fs');
const contractSource = fs.readFileSync(__dirname + '/Tipping.aes', 'utf-8');

class Aeternity {
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
        networkId: 'ae_mainnet',
        compilerUrl: process.env.COMPILER_URL,
      });
      this.contract = await this.client.getContractInstance(contractSource, { contractAddress: process.env.CONTRACT_ADDRESS });
      console.log('initialized aeternity sdk');
    }
  };

  callContract = async (address, url) => {
    if (!this.client) throw new Error('Init sdk first');
    const tips = await this.contract.methods.get_state();
    return tips.decodedResult.tips;
  };
}

const ae = new Aeternity();
ae.init();

module.exports = ae;
