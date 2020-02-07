const Router = require('express').Router;
const CommentLogic = require('../logic/commentLogic.js');

const router = new Router();

const userAuth = (req, res, next) => {

  // TODO verify signature

  return next();
};

const adminAuth = (req, res, next) => {

  // TODO verify admin

  return next();
};

// Open api routes
router.get('/api', CommentLogic.getAllItems);
router.get('/api/:id', CommentLogic.getSingleItem);
router.get('/api/tip/:tipId', CommentLogic.getAllItemsForThread);

// Restricted api routes
router.put('/api/:id', adminAuth, CommentLogic.updateItem);
router.post('/api', userAuth, CommentLogic.addItem);
router.delete('/api/:id', adminAuth, CommentLogic.removeItem);

module.exports = router;
