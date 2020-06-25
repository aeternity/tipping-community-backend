const { Router } = require('express');
const CacheLogic = require('../logic/cacheLogic.js');

const router = new Router();

CacheLogic.init(); // calls init

// Open api routes
router.get('/tip', CacheLogic.deliverTip);

router.get('/tips', CacheLogic.deliverTips);

router.get('/stats', CacheLogic.deliverStats);

router.get('/userStats', CacheLogic.deliverUserStats);

router.get('/chainNames', CacheLogic.deliverChainNames);

router.get('/price', CacheLogic.deliverPrice);

router.get('/oracle', CacheLogic.deliverOracleState);

router.get('/topics', CacheLogic.deliverTipTopics);

router.get('/events', CacheLogic.deliverContractEvents);

router.get('/tokenInfo', CacheLogic.deliverTokenInfo);

router.get('/invalidate/tips', CacheLogic.invalidateTips);

router.get('/invalidate/oracle', CacheLogic.invalidateOracle);

router.get('/invalidate/events', CacheLogic.invalidateContractEvents);

module.exports = router;
