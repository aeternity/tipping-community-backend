const { Router } = require('express');
const PayForTxLogic = require('../logic/payForTxLogic.js');

const router = new Router();

// Open api routes
router.post('/submit', PayForTxLogic.payForTx);

module.exports = router;
