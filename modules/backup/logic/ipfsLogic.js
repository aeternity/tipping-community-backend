const ipfsClient = require('ipfs-http-client');

class IPFSLogic {
  constructor() {
    if (!process.env.IPFS_URL) throw new Error('IPFS_URL is not set');
    this.node = ipfsClient(process.env.IPFS_URL);
  }

  static async asyncGeneratorToArray(generator) {
    const all = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const result of generator) {
      all.push(result);
    }
    return all;
  }

  async checkFileExists(hash) {
    const result = await Promise.race([
      this.node.files.stat(`/ipfs/${hash}`),
      new Promise(resolve => {
        setTimeout(() => {
          resolve(null);
        }, 1000);
      }),
    ]);
    if (!result) return false;
    return result.cid.toString() === hash;
  }

  async addFile(buffer) {
    const generator = this.node.add({
      content: buffer,
    });
    return IPFSLogic.asyncGeneratorToArray(generator);
  }

  async pinFile(hash) {
    return this.node.pin.add(hash);
  }

  async getPinnedFiles() {
    return IPFSLogic.asyncGeneratorToArray(this.node.pin.ls());
  }

  async getFile(hash) {
    if (await this.checkFileExists(hash)) {
      const data = await IPFSLogic.asyncGeneratorToArray(this.node.cat(hash));
      return Buffer.concat(data);
    }

    throw Error(`IPFS: ${hash} not found`);
  }
}

const ipfs = new IPFSLogic();
module.exports = ipfs;
