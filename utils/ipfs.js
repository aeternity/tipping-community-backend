const ipfsClient = require('ipfs-http-client');

class IPFS {

  node;

  constructor() {
    if (!process.env.IPFS_URL) throw "IPFS_URL is not set";
    this.node = ipfsClient(process.env.IPFS_URL);
  }


  _asyncGeneratorToArray = async (generator) => {
    const all = [];
    for await (const result of generator) {
      all.push(result);
    }
    return all;
  };

  checkFileExists = async (hash) => {
    const result = await Promise.race([
      this.node.files.stat(`/ipfs/${hash}`),
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, 1000);
      })
    ]);
    if(!result) return false;
    return result.cid.toString() === hash;
  };

  addFile = async (buffer) => {
    const generator = this.node.add({
      content: buffer,
    });
    return this._asyncGeneratorToArray(generator);
  };

  pinFile = (hash) => {
    return this.node.pin.add(hash);
  };

  getPinnedFiles = async () => {
    return this._asyncGeneratorToArray(this.node.pin.ls())
  };

  getFile = async (hash) => {
    if(await this.checkFileExists(hash)) {
      const data = await this._asyncGeneratorToArray(this.node.cat(hash));
      return Buffer.concat(data);
    }

    throw Error(`IPFS: ${hash} not found`);
  };
}

const ipfs = new IPFS();
module.exports = ipfs;
