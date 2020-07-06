const { Router } = require('express');
const Logic = require('../logic/linkPreviewLogic.js');

const router = new Router();

// Open api routes
router.get('/', Logic.getLinkPreview);
router.get('/:url', Logic.getLinkPreview);
router.get('/image/:filename', Logic.getImage);

module.exports = router;
