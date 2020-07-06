const { Router } = require('express');
const TipTracing = require('../logic/tipTracingLogic.js');

const router = new Router();

// Open api routes
router.get('/backend', TipTracing.getAllTraces);
router.get('/blockchain', TipTracing.fetchBlockchainTrace);

module.exports = router;
