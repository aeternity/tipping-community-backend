const TipTracing = require('../logic/tipTracingLogic.js');
const Router = require('express').Router;

const router = new Router();

// Open api routes
router.get('/backend', TipTracing.getAllTraces);
router.get('/blockchain', TipTracing.fetchBlockchainTrace);

module.exports = router;

