const { Router } = require('express');
const ConsentLogic = require('../logic/consentLogic');
const { signatureAuth } = require('../utils/auth.js');

const router = new Router();

// Open api routes
router.get('/:author', signatureAuth, ConsentLogic.getAllItemsForUser);
router.get('/:author/:scope', signatureAuth, ConsentLogic.getSingleItem);

// Restricted api routes
router.post('/:author/:scope', signatureAuth, ConsentLogic.upsertItem);
router.delete('/:author/:scope', signatureAuth, ConsentLogic.removeItem);

module.exports = router;
