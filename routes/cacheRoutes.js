const CacheLogic = require('../logic/cacheLogic.js');
const Router = require('express').Router;

const router = new Router();

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

router.get('/invalidate/tips', CacheLogic.invalidateTips);

router.get('/invalidate/oracle', CacheLogic.invalidateOracle);

router.get('/invalidate/events', CacheLogic.invalidateContractEvents);

module.exports = router;

