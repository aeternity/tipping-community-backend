const fs = require('fs');
const ipfs = require('../utils/ipfs');

const { IPFSEntry } = require('../models');

module.exports = class BackupLogic {

  static types = {
    PROFILE_IMAGE: 'PROFILE_IMAGE',
    COVER_IMAGE: 'COVER_IMAGE'
  };

  static async backupImageToIPFS (imagePath, publicKey, type) {
    const buffer = fs.readFileSync(imagePath);
    const results = await ipfs.addFile(buffer);
    if(!BackupLogic.types.hasOwnProperty(type)) throw TypeError('Unknown type: ' + type)
    IPFSEntry.create({
      type,
      hash: results[0].path,
      reference: publicKey
    });
  }

};
