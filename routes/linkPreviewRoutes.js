const Router = require('express').Router;
const Logic = require('../logic/linkPreviewLogic.js');
const { basicAuth } = require('../utils/auth.js');

const router = new Router();

// Open api routes
router.get('/', Logic.getAllLinkPreviews);

router.post('/force/', basicAuth, Logic.forceRequery);

module.exports = router;
