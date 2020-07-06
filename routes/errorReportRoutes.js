const { Router } = require('express');
const Logic = require('../logic/errorReportLogic.js');
const { basicAuth } = require('../utils/auth.js');

const router = new Router();

// View routes
router.get('/', basicAuth, Logic.getAllItems);

// Restricted api routes
router.post('/', Logic.addItem);

module.exports = router;
