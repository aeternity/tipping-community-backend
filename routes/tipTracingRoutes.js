const TipTracing = require('../logic/tipTracingLogic.js');
const Router = require('express').Router;

const router = new Router();

new TipTracing(); //calls init

// Open api routes
router.get('/blockchain', TipTracing.fetchBlockchainTrace);

module.exports = router;

