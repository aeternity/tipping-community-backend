const HealthLogic = require('../logic/healthLogic.js');
const Router = require('express').Router;

const router = new Router();

// Open api routes
router.get('/backend', HealthLogic.answerHealthRequest);

module.exports = router;
