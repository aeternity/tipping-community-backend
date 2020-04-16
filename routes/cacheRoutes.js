const CacheLogic = require('../logic/cacheLogic.js');
const Router = require('express').Router;

const router = new Router();

const cache = new CacheLogic();

// Open api routes
router.get('/tip', CacheLogic.deliverTip);

router.get('/tips', CacheLogic.deliverTips);

router.get('/stats', CacheLogic.deliverStats);

router.get('/userStats', CacheLogic.deliverUserStats);

router.get('/chainNames', CacheLogic.deliverChainNames);

router.get('/price', CacheLogic.deliverPrice);

router.get('/oracle', CacheLogic.deliverOracleState);

router.get('/topics', CacheLogic.deliverTipTopics);

router.get('/invalidate/tips', CacheLogic.invalidateTips);

router.get('/invalidate/oracle', CacheLogic.invalidateOracle);

module.exports = router;

