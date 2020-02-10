const Router = require('express').Router;
const CommentLogic = require('../logic/commentLogic.js');
const { basicAuth } = require('../utils/auth.js');

const router = new Router();

const userAuth = (req, res, next) => {

  // TODO verify signature

  return next();
};


// Open api routes
router.get('/api', CommentLogic.getAllItems);
router.get('/api/:id', CommentLogic.getSingleItem);
router.get('/api/tip/:tipId', CommentLogic.getAllItemsForThread);

// Restricted api routes
router.put('/api/:id', basicAuth, CommentLogic.updateItem);
router.post('/api', userAuth, CommentLogic.addItem);
router.delete('/api/:id', basicAuth, CommentLogic.removeItem);

module.exports = router;
