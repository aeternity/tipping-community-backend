const { Router } = require('express');
const HealthLogic = require('../logic/healthLogic.js');

const router = new Router();

// Open api routes
router.get('/backend', HealthLogic.answerHealthRequest);

module.exports = router;
