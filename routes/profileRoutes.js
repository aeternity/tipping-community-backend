const multer = require('multer');
const { Router } = require('express');
const path = require('path');
const ProfileLogic = require('../logic/profileLogic.js');
const { signatureAuth } = require('../utils/auth.js');

const router = new Router();
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'images/');
  },
  filename(req, file, cb) {
    cb(null, `${req.params.author}-${Date.now()}${path.extname(file.originalname)}`); // Appending extension
  },
});
const upload = multer({
  storage,
  limits: {
    fieldSize: 5000000,
  },
});

// Open api routes
router.get('/:author', ProfileLogic.getSingleItem);
router.post(
  '/:author',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  signatureAuth,
  ProfileLogic.verifyRequest,
  ProfileLogic.upsertProfile,
);

// Image routes
router.get('/image/:author', ProfileLogic.getImage);

// Legacy routes
router.post(
  '/image/:author',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  signatureAuth,
  ProfileLogic.verifyRequest,
  ProfileLogic.upsertProfile,
);
router.delete(
  '/image/:author',
  signatureAuth,
  ProfileLogic.verifyRequest,
  ProfileLogic.deleteImage,
);
router.post(
  '/',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  signatureAuth,
  ProfileLogic.verifyRequest,
  ProfileLogic.upsertProfile,
);

module.exports = router;
