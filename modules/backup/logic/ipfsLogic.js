const ipfsClient = require('ipfs-http-client');

let node;

const ipfs = {
  init() {
    if (!process.env.IPFS_URL) throw new Error('IPFS_URL is not set');
    node = ipfsClient.create(process.env.IPFS_URL);
  },

  async getCoreVitals() {
    return {
      version: await node.version(),
    };
  },

  async asyncGeneratorToArray(generator) {
    const all = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const result of generator) {
      all.push(result);
    }
    return all;
  },

  async checkFileExists(hash) {
    const result = await Promise.race([
      node.files.stat(`/ipfs/${hash}`),
      new Promise(resolve => {
        setTimeout(() => {
          resolve(null);
        }, 1000);
      }),
    ]);
    if (!result) return false;
    return result.cid.toString() === hash;
  },

  async addFile(buffer) {
    return node.add({
      content: buffer,
    });
  },

  async pinFile(hash) {
    return node.pin.add(hash);
  },

  async getPinnedFiles() {
    return ipfs.asyncGeneratorToArray(node.pin.ls());
  },

  async getFile(hash) {
    if (await ipfs.checkFileExists(hash)) {
      const data = await ipfs.asyncGeneratorToArray(node.cat(hash));
      return Buffer.concat(data);
    }

    throw Error(`IPFS: ${hash} not found`);
  },

};

module.exports = ipfs;
