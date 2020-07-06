const { Router } = require('express');
const Logic = require('../logic/verifiedLogic.js');

const router = new Router();

// Open api routes
router.get('/', Logic.getAllClaimedEvents);

module.exports = router;
