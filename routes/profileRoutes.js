const multer = require('multer');
const Router = require('express').Router;
const ProfileLogic = require('../logic/profileLogic.js');
const { signatureAuth } = require('../utils/auth.js');
const path = require('path');

const router = new Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/')
  },
  filename: function (req, file, cb) {
    cb(null,`${req.params.author}-${Date.now()}${path.extname(file.originalname)}`) //Appending extension
  }
});
const upload = multer({ storage });


// Open api routes
router.get('/:author', ProfileLogic.getSingleItem);
router.post('/', signatureAuth, ProfileLogic.createProfile);
router.delete('/:author', signatureAuth, ProfileLogic.verifyRequest, ProfileLogic.removeItem);

// Image Routes
router.get('/image/:author', ProfileLogic.getImage);
router.post('/image/:author', upload.single('image'), signatureAuth, ProfileLogic.verifyRequest, ProfileLogic.updateImage);
router.delete('/image/:author', signatureAuth, ProfileLogic.verifyRequest, ProfileLogic.deleteImage);

module.exports = router;
