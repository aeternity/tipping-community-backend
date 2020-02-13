const LanguageLogic = require('../logic/languageLogic.js');
const Router = require('express').Router;

const router = new Router();

// Open api routes
router.get('/en', LanguageLogic.getNonChinesePosts);
router.get('/zh', LanguageLogic.getChinesePosts);

module.exports = router;

