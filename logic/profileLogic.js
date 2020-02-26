const { Profile } = require('../utils/database.js');
const path = require('path');
const fs = require('fs');

module.exports = class ProfileLogic {

  static async createProfile (req, res) {
    try {
      const { address, biography } = req.body;
      if (!address) return res.status(400).send('Missing required field address');
      const entry = await Profile.create({ address, biography });
      res.send(entry);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.message);
    }
  }

  static async removeItem (req, res) {
    const result = await Profile.destroy({
      where: {
        address: req.params.address,
      },
    });
    return result === 1 ? res.sendStatus(200) : res.sendStatus(404);
  }

  static async getSingleItem (req, res) {
    const result = await Profile.findOne({ where: { id: req.params.address }, raw: true });
    if (!result) res.sendStatus(404);
    result.image = !!result.image;
    res.send(result);
  };

  static async updateItem (req, res) {
    const { biography } = req.body;
    if (!biography) return res.status(400).send('Missing required field biography');
    await Profile.update({
      ...biography && { biography }
    }, { where: { address: req.params.address }, raw: true });
    return ProfileLogic.getSingleItem(req, res)
  }

  static async getImage (req, res) {
    const result = await Profile.findOne({ where: { address: req.params.address }, raw: true });
    if (!result || !result.image) return res.sendStatus(404);
    res.sendFile(path.resolve(__dirname, 'image', result.image));
  }

  static async updateImage (req, res) {
    const result = await Profile.findOne({ where: { address: req.params.address }, raw: true });
    if (!result) res.sendStatus(404);
    await Profile.update({
      image: `${req.file.image.filename}`,
    }, { where: { address: req.params.address }, raw: true });
    res.send(200);
  }

  static async deleteImage (req, res) {
    const result = await Profile.findOne({ where: { address: req.params.address }, raw: true });
    if (!result || !result.image) return res.sendStatus(404);
    fs.unlinkSync(result.image);
    await Profile.update({
      image: null,
    }, { where: { address: req.params.address }, raw: true });
    res.send(200);
  }
};
