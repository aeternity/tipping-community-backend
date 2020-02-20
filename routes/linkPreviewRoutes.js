const Router = require('express').Router;
const Logic = require('../logic/linkPreviewLogic.js');

const router = new Router();

// Open api routes
router.get('/', Logic.getLinkPreview);
router.get('/:url', Logic.getLinkPreview);

module.exports = router;
