const CacheLogic = require('../logic/cacheLogic.js');
const { basicAuth } =require('../utils/auth.js');
const Router = require('express').Router;

const router = new Router();

const cache = new CacheLogic();

// Open api routes
router.get('/tips', CacheLogic.deliverTips);

router.get('/stats', CacheLogic.deliverStats);

router.get('/chainNames', CacheLogic.deliverChainNames);

router.get('/price', CacheLogic.deliverPrice);

router.get('/oracle', CacheLogic.deliverOracleState);


router.get('/invalidate/tips', CacheLogic.invalidateTips);

// View routes
router.get('/status', basicAuth, async (req, res) => res.render('cache', {
  status: await cache.getStatus()
}));


module.exports = router;

