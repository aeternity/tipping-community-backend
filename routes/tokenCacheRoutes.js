const { Router } = require('express');
const TokenCacheLogic = require('../logic/tokenCacheLogic.js');

const router = new Router();

TokenCacheLogic.init(); // calls init

// Open api routes
router.get('/tokenInfo', TokenCacheLogic.deliverTokenInfo);

router.post('/addToken', TokenCacheLogic.indexTokenInfo);

router.get('/balances', TokenCacheLogic.tokenAccountBalance);

module.exports = router;
