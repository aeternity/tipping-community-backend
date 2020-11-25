const fs = require('fs');
const ipfs = require('./ipfsLogic');

const { IPFSEntry } = require('../../../models');
const { IPFS_TYPES } = require('../constants/ipfsTypes');

module.exports = class BackupLogic {
  static async backupImageToIPFS(imagePath, publicKey, type) {
    const buffer = fs.readFileSync(imagePath);
    const results = await ipfs.addFile(buffer);
    if (!IPFS_TYPES[type]) throw TypeError(`Unknown type: ${type}`);
    return IPFSEntry.create({
      type,
      hash: results[0].path,
      reference: publicKey,
    });
  }
};
