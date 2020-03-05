const { Profile } = require('../models');
const path = require('path');
const fs = require('fs');

module.exports = class ProfileLogic {

  static async createProfile (req, res) {
    try {
      const { author, biography, signature, challenge } = req.body;
      if (!author) return res.status(400).send('Missing required field author');
      const entry = await Profile.create({ author, biography, signature, challenge });
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
    return res.send(result);
  };

  static async updateItem (req, res) {
    const { biography } = req.body;
    if (!biography) return res.status(400).send('Missing required field biography');
    await Profile.update({
      ...biography && { biography },
    }, { where: { author: req.params.author }, raw: true });
    return ProfileLogic.getSingleItem(req, res)
  }

  static async getImage (req, res) {
    const result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result || !result.image) return res.sendStatus(404);
    res.sendFile(path.resolve(__dirname, '../images', result.image));
  }

  static async updateImage (req, res) {
    const result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result) return res.status(404).send({err: 'Could not find associated profile. Please create one first.'});
    if (!req.file) return res.status(400).send({err: 'Could not find any image in your request.'});
    // Delete existing image
    if(result.image && result.image !== req.file.filename) fs.unlinkSync('images/' + result.image);
    await Profile.update({
      image: `${req.file.filename}`,
      imageSignature: req.body.signature,
      imageChallenge: req.body.challenge
    }, { where: { author: req.params.author }, raw: true });
    res.sendStatus(200);
  }

  static async deleteImage (req, res) {
    const result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result || !result.image) return res.sendStatus(404);
    fs.unlinkSync('images/' + result.image);
    await Profile.update({
      image: null,
      imageSignature: null,
      imageChallenge: null
    }, { where: { author: req.params.author }, raw: true });
    res.sendStatus(200);
  }

  static async verifyRequest (req, res, next) {
    const authorInParams = req.params.author;
    const authorInBody = req.body.author;
    if (authorInBody && authorInParams) {
      return authorInBody === authorInParams ? next() : res.status(401).send({ err: 'Author in url is not equal to author in body.' })
    } else return next();
  }
};
