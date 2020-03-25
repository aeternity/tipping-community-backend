const CacheLogic = require('../logic/cacheLogic.js');
const { basicAuth } =require('../utils/auth.js');
const Router = require('express').Router;

const router = new Router();

const cache = new CacheLogic();

// Open api routes
router.get('/', CacheLogic.deliverAllItems);

router.get('/oracle', CacheLogic.deliverOracleState);

router.get('/invalidate/tips', CacheLogic.invalidateTips);

// View routes
router.get('/status', basicAuth, async (req, res) => res.render('cache', {
  status: await cache.getStatus()
}));


module.exports = router;

