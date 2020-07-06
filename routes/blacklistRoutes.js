const { Router } = require('express');
const Logic = require('../logic/blacklistLogic.js');
const ae = require('../utils/aeternity.js');
const { basicAuth, signatureAuth } = require('../utils/auth.js');

const router = new Router();

// Open api routes
router.get('/api', Logic.getAllItems);
router.get('/api/:tipId', Logic.getSingleItem);

// View routes
router.get('/', basicAuth, async (req, res) => res.render('admin', {
  allItems: await Logic.augmentAllItems(await ae.getTips()),
}));

// Restricted api routes
router.post('/api', basicAuth, Logic.addItem);
router.put('/api/:tipId', basicAuth, Logic.updateItem);
router.delete('/api/:tipId', basicAuth, Logic.removeItem);

// Public routes
router.post('/api/wallet', signatureAuth, Logic.flagTip);

module.exports = router;
