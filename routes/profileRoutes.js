const multer = require('multer');
const Router = require('express').Router;
const ProfileLogic = require('../logic/profileLogic.js');
const { signatureAuth } = require('../utils/auth.js');
const path = require('path');

const router = new Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/');
  },
  filename: function (req, file, cb) {
    cb(null, `${req.params.author}-${Date.now()}${path.extname(file.originalname)}`); //Appending extension
  },
});
const upload = multer({ storage });


// Open api routes
router.get('/:author', ProfileLogic.getSingleItem);
router.post('/:author', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1, }]), signatureAuth, ProfileLogic.verifyRequest, ProfileLogic.upsertProfile);

// Image routes
router.get('/image/:author', ProfileLogic.getImage);


// Legacy routes
router.post('/image/:author', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1, }]), signatureAuth, ProfileLogic.verifyRequest, ProfileLogic.upsertProfile);
router.delete('/image/:author', signatureAuth, ProfileLogic.verifyRequest, ProfileLogic.deleteImage);
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1, }]), signatureAuth, ProfileLogic.verifyRequest, ProfileLogic.upsertProfile);


module.exports = router;
