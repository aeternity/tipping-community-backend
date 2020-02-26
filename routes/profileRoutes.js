const multer = require('multer');
const upload = multer({ dest: 'images/' });
const Router = require('express').Router;
const ProfileLogic = require('../logic/profileLogic.js');
const { basicAuth, signatureAuth } = require('../utils/auth.js');

const router = new Router();

// Open api routes
router.get('/:address', ProfileLogic.getSingleItem);
router.post('/:address', signatureAuth, ProfileLogic.createProfile);
router.put('/:address', signatureAuth, ProfileLogic.updateItem);
router.delete('/:address', signatureAuth, ProfileLogic.removeItem);

// Image Routes
router.get('/image/:address', ProfileLogic.getImage);
router.post('/image/:address', upload.single('image') ,signatureAuth, ProfileLogic.updateImage);
router.delete('/image/:address', signatureAuth, ProfileLogic.deleteImage);

module.exports = router;
