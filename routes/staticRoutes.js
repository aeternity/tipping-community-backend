const Router = require('express').Router;
const StaticLogic = require('../logic/staticLogic.js');

const router = new Router();

// Open api routes
router.get('/stats', StaticLogic.getStats);
router.get('/wallet/graylist', StaticLogic.getGrayList);

module.exports = router;
