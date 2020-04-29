const fs = require('fs');
const ipfs = require('../utils/ipfs');

const { IPFSEntry } = require('../models');

module.exports = class BackupLogic {

  static types = {
    PROFILE_IMAGE: 'PROFILE_IMAGE',
  };

  static async backupProfileImageToIPFS (imagePath, publicKey) {
    const buffer = fs.readFileSync(imagePath);
    const results = await ipfs.addFile(buffer);
    IPFSEntry.create({
      type: this.types.PROFILE_IMAGE,
      hash: results[0].path,
      reference: publicKey
    });
  }
};
