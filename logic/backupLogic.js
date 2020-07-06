const fs = require('fs');
const ipfs = require('../utils/ipfs');

const { IPFSEntry } = require('../models');
const { IPFS_TYPES } = require('../models/enums/ipfs');

module.exports = class BackupLogic {
  static async backupImageToIPFS(imagePath, publicKey, type) {
    const buffer = fs.readFileSync(imagePath);
    const results = await ipfs.addFile(buffer);
    if (!IPFS_TYPES[type]) throw TypeError(`Unknown type: ${type}`);
    IPFSEntry.create({
      type,
      hash: results[0].path,
      reference: publicKey,
    });
  }
};
