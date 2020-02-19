const Router = require('express').Router;

const router = new Router();

// Open api routes
router.get('/contract', (req, res) => res.send({ contractFile: process.env.CONTRACT_FILE, contractAddress: process.env.CONTRACT_ADDRESS }));

module.exports = router;
