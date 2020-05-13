const Router = require('express').Router;
const { TracingLogic } = require('../logic/tracingLogic.js');

const router = new Router();

// Open api routes
router.get('/', TracingLogic.getAllTraces);

module.exports = router;
