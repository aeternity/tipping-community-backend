const Router = require('express').Router;
const Logic = require('../logic/pinLogic.js');
const { signatureAuth } = require('../utils/auth.js');

const router = new Router();

// Open api routes
router.get('/:author', Logic.getAllItemsPerUser);

// Restricted api routes
router.post('/:author', signatureAuth, Logic.addItem);
router.delete('/:author', signatureAuth, Logic.removeItem);

module.exports = router;
