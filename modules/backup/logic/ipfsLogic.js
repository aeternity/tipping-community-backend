const ipfsClient = require('ipfs-http-client');

let node;
function init() {
  if (!process.env.IPFS_URL) throw new Error('IPFS_URL is not set');
  node = ipfsClient(process.env.IPFS_URL);
}

async function asyncGeneratorToArray(generator) {
  const all = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const result of generator) {
    all.push(result);
  }
  return all;
}

async function checkFileExists(hash) {
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
}

async function addFile(buffer) {
  return node.add({
    content: buffer,
  });
}

async function pinFile(hash) {
  return node.pin.add(hash);
}

async function getPinnedFiles() {
  return asyncGeneratorToArray(node.pin.ls());
}

async function getFile(hash) {
  if (await checkFileExists(hash)) {
    const data = await asyncGeneratorToArray(node.cat(hash));
    return Buffer.concat(data);
  }

  throw Error(`IPFS: ${hash} not found`);
}

module.exports = {
  init,
  checkFileExists,
  addFile,
  pinFile,
  getPinnedFiles,
  getFile,
};
