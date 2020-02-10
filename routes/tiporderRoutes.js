const Router = require('express').Router;
const Logic = require('../logic/tiporderLogic.js');

const router = new Router();

// Open api routes
router.get('/', Logic.getScoredBlacklistedOrder);

module.exports = router;
