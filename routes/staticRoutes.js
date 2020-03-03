const Router = require('express').Router;
const StaticLogic = require('../logic/staticLogic.js');

const router = new Router();

// Open api routes
router.get('/contract', StaticLogic.getContract);
router.get('/stats', StaticLogic.getStats);

module.exports = router;
