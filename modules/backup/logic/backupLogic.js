const ipfs = require('./ipfsLogic');
const imageLogic = require('../../media/logic/imageLogic');
const { IPFSEntry } = require('../../../models');
const { IPFS_TYPES } = require('../constants/ipfsTypes');

async function backupImageToIPFS(filename, publicKey, type) {
  const buffer = imageLogic.readImage(filename);
  const result = await ipfs.addFile(buffer);
  if (!IPFS_TYPES[type]) throw TypeError(`Unknown type: ${type}`);
  return IPFSEntry.create({
    type,
    hash: result.path,
    reference: publicKey,
  });
}

module.exports = {
  backupImageToIPFS,
};
