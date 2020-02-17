const LoggerLogic = require('../logic/loggerLogic.js');
const Router = require('express').Router;
const { basicAuth } = require('../utils/auth.js');

const router = new Router();

// Open api routes
router.get('/all', basicAuth, LoggerLogic.showLogs);

module.exports = router;

