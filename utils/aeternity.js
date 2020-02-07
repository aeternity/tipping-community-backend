const {Universal, Node} = require('@aeternity/aepp-sdk');
const fs = require('fs');

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
      this.contract = await this.client.getContractInstance(this.getContractSource(), { contractAddress: process.env.CONTRACT_ADDRESS });
      console.log('initialized aeternity sdk');
    }
  };

  callContract = async () => {
    if (!this.client) throw new Error('Init sdk first');
    const tips = await this.contract.methods.get_state();
    return tips.decodedResult.tips;
  };

  getContractSource = () => {
    if (!process.env.CONTRACT_FILE) throw new Error(`env.CONTRACT_FILE is ${process.env.CONTRACT_FILE}`);
    return fs.readFileSync(`${__dirname}/${process.env.CONTRACT_FILE}.aes`, 'utf-8')
  }
}

const ae = new Aeternity();
ae.init();

module.exports = ae;
