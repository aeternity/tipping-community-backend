const Router = require('express').Router;
const Logic = require('../logic/blacklistLogic.js');
const ae = require('../utils/aeternity.js');
const { basicAuth } = require('../utils/auth.js');

const router = new Router();

// Open api routes
router.get('/api', Logic.getAllItems);
router.get('/api/:id', Logic.getSingleItem);

// View routes
router.get('/', basicAuth, async (req, res) => res.render('admin', {
  allItems: await Logic.augmentAllItems((await ae.getTips()).tips)
}));

// Restricted api routes
router.post('/api', basicAuth, Logic.addItem);
router.delete('/api/:id', basicAuth, Logic.removeItem);

module.exports = router;
