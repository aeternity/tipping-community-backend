const PayForTxLogic = require('../logic/payForTxLogic.js');
const Router = require('express').Router;

const router = new Router();

// Open api routes
router.post('/submit', PayForTxLogic.payForTx);

module.exports = router;

