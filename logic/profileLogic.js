const path = require('path');
const fs = require('fs');

const BackupLogic = require('./backupLogic');
const aeternity = require('../utils/aeternity.js');
const { Profile } = require('../models');

module.exports = class ProfileLogic {

  static async createProfile (req, res) {
    try {
      const { author, biography, preferredChainName, referrer, signature, challenge } = req.body;
      if (!author) return res.status(400).send('Missing required field author');
      const existing = await Profile.findOne({ where: { author }, raw: true });
      if (existing) return await ProfileLogic.updateProfile(req, res)
      const entry = await Profile.create({ author, biography, preferredChainName, referrer, signature, challenge });
      res.send(entry);

    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }

  static async removeItem (req, res) {
    const result = await Profile.destroy({
      where: {
        author: req.params.author,
      },
    });
    return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
  }

  static async getSingleItem (req, res) {
    const result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result) return res.sendStatus(404);
    result.image = !!result.image;
    result.referrer = !!result.referrer;
    return res.send(result);
  };

  static async updateProfile (req, res) {
    const { author, biography, preferredChainName, referrer, signature, challenge } = req.body;
    await Profile.update({
      ...(typeof biography !== 'undefined') && { biography },
      ...(typeof preferredChainName !== 'undefined') && { preferredChainName },
      ...(typeof referrer !== 'undefined') && { referrer },
      signature,
      challenge,
    }, { where: { author } });
    return res.send((await Profile.findOne({ where: { author }})).toJSON())
  }

  static async getImage (req, res) {
    const result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result || !result.image) return res.sendStatus(404);
    res.sendFile(path.resolve(__dirname, '../images', result.image));
  }

  static async updateImage (req, res) {
    let result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result) {
      result = await Profile.create({
        author: req.params.author,
        signature: req.body.signature,
        challenge: req.body.challenge,
      });
    }
    if (!req.file) return res.status(400).send({ err: 'Could not find any image in your request.' });
    // Delete existing image
    if (result.image && result.image !== req.file.filename) fs.unlinkSync('images/' + result.image);
    await BackupLogic.backupProfileImageToIPFS('images/' + req.file.filename, result.author);
    await Profile.update({
      image: `${req.file.filename}`,
      imageSignature: req.body.signature,
      imageChallenge: req.body.challenge,
    }, { where: { author: req.params.author }, raw: true });
    return ProfileLogic.getSingleItem(req, res);
  }

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

  static async verifyRequest (req, res, next) {
    // Get author
    const author = req.params.author ? req.params.author : req.body.author;
    if(!author) return res.status(400).send({err: 'Missing author'});

    // No chain name
    if (typeof req.body.preferredChainName === 'undefined') return next();

    // Can be called without init because its technically static
    const chainNames = (await aeternity.getChainNamesByAddress(author))
      .reduce((acc, curr) => [...acc, curr.name], []);

    // check if chain name points to author
    return chainNames.includes(req.body.preferredChainName) ? next() : res.status(400).send({err: 'Chainname does not point to author'})


  }
};
