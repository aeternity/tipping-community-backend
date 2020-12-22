const fs = require('fs');
const path = require('path');
const { IMAGE_DIRECTORY } = require('../constants/paths');

class ImageLogic {
  constructor() {
    if (!fs.existsSync(IMAGE_DIRECTORY)) fs.mkdirSync(IMAGE_DIRECTORY);
  }

  readImage(filename) {
    return fs.readFileSync(path.join(IMAGE_DIRECTORY, filename));
  }

  writeImage(filename, buffer) {
    fs.writeFileSync(path.join(IMAGE_DIRECTORY, filename), buffer);
    return true;
  }

  checkIfImageExists(filename) {
    return fs.existsSync(path.join(IMAGE_DIRECTORY, filename));
  }

  deleteImage(filename) {
    fs.unlinkSync(path.join(IMAGE_DIRECTORY, filename));
    return true;
  }

  getImagePath(filename) {
    return path.join(IMAGE_DIRECTORY, filename);
  }
}

const imageLogic = new ImageLogic();
module.exports = imageLogic;
