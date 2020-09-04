const TokenCacheLogic = require('../logic/tokenCacheLogic.js');
const Router = require('express').Router;

const router = new Router();

new TokenCacheLogic(); //calls init

// Open api routes
router.get('/tokenInfo', TokenCacheLogic.deliverTokenInfo);

router.post('/addToken', TokenCacheLogic.indexTokenInfo);

router.get('/balances', TokenCacheLogic.tokenAccountBalance);

router.get('/invalidate/:token', TokenCacheLogic.invalidateTokenCache);

module.exports = router;

