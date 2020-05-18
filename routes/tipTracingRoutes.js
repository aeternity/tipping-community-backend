const TipTracing = require('../logic/tipTracingLogic.js');
const Router = require('express').Router;

const router = new Router();

// Clean all files once on startup
TipTracing.cleanAllTraces()

// Open api routes
router.get('/backend', TipTracing.getAllTraces);
router.get('/blockchain', TipTracing.fetchBlockchainTrace);

module.exports = router;

