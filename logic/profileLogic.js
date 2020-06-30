const path = require('path');
const fs = require('fs');

const BackupLogic = require('./backupLogic');
const aeternity = require('../utils/aeternity.js');
const { Profile } = require('../models');
const { IPFS_TYPES } = require('../models/enums/ipfs');

module.exports = class ProfileLogic {

  static async upsertProfile(req, res) {
    try {
      const { biography, preferredChainName, referrer, location, signature, challenge } = req.body;
      let { image, coverImage } = (req.files ? req.files : {});
      // allow image deletion
      if(!image && req.body.image === null) image = [{ filename: null }];
      if(!coverImage && req.body.coverImage === null) coverImage = [{ filename: null }];
      // get author
      const author = req.body.author ? req.body.author : (req.params.author ? req.params.author : null);
      if (!author) return res.status(400).send('Missing required field author');
      const existing = await Profile.findOne({ where: { author }, raw: true });
      // Backup to IPFS
      if (existing) {
        await Profile.update({
          ...(typeof biography !== 'undefined') && { biography },
          ...(typeof preferredChainName !== 'undefined') && { preferredChainName },
          ...(typeof referrer !== 'undefined') && { referrer },
          ...(typeof location !== 'undefined') && { location },
          ...(typeof image !== 'undefined') && { image: image[0].filename },
          ...(typeof coverImage !== 'undefined') && { coverImage: coverImage[0].filename },
          signature,
          challenge,
        }, { where: { author } });
        if (image && existing.image && existing.image !== image[0].filename) fs.unlinkSync('images/' + existing.image);
        if (coverImage && existing.coverImage && existing.coverImage !== coverImage[0].filename) fs.unlinkSync('images/' + existing.coverImage);
      } else {
        await Profile.create({
          author,
          biography,
          preferredChainName,
          referrer,
          signature,
          challenge,
          image: image ? image[0].filename : null,
          coverImage: coverImage ? coverImage[0].filename : null,
          location,
        });
      }
      if(image && image[0].filename !== null) await BackupLogic.backupImageToIPFS('images/' + image[0].filename, author, IPFS_TYPES.PROFILE_IMAGE);
      if(coverImage && coverImage[0].filename !== null) await BackupLogic.backupImageToIPFS('images/' + coverImage[0].filename, author, IPFS_TYPES.COVER_IMAGE);
      return ProfileLogic.getSingleItem(req, res);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }

  static async getSingleItem(req, res) {
    const author = req.body.author ? req.body.author : (req.params.author ? req.params.author : null);
    let result = await Profile.findOne({ where: { author } });
    if (!result) return res.sendStatus(404);
    result = result.toJSON();
    result.image = result.image ? `/images/${result.image}` : false;
    result.coverImage = result.coverImage ? `/images/${result.coverImage}` : false;
    result.referrer = !!result.referrer;
    return res.send(result);
  };

  // LEGACY
  static async deleteImage (req, res) {
    const result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result || !result.image) return res.sendStatus(404);
    fs.unlinkSync('images/' + result.image);
    await Profile.update({
      image: null,
      imageSignature: null,
      imageChallenge: null,
    }, { where: { author: req.params.author }, raw: true });
    res.sendStatus(200);
  }

  static async getImage(req, res) {
    const result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result || !result.image) return res.sendStatus(404);
    res.sendFile(path.resolve(__dirname, '../images', result.image));
  }

  static async verifyRequest(req, res, next) {
    // Get author
    const author = req.params.author ? req.params.author : req.body.author;
    if (!author) return res.status(400).send({ err: 'Missing author' });

    // No chain name
    if (typeof req.body.preferredChainName === 'undefined') return next();

    // Can be called without init because its technically static
    const chainNames = (await aeternity.getChainNamesByAddress(author))
      .reduce((acc, curr) => [...acc, curr.name], []);

    // check if chain name points to author
    return chainNames.includes(req.body.preferredChainName) ? next() : res.status(400).send({ err: 'Chainname does not point to author' });

  }
};
