const Router = require('express').Router;
const CommentLogic = require('../logic/commentLogic.js');
const { signatureAuth } = require('../utils/auth.js');

const router = new Router();

// Open api routes
router.get('/api/', CommentLogic.getAllItems);
router.get('/api/:id', CommentLogic.getSingleItem);
router.get('/api/tip/:tipId', CommentLogic.getAllItemsForThread);

// Count routes
router.get('/count/tips/', CommentLogic.getCommentCountForTips);
router.get('/count/author/:author', CommentLogic.getCommentCountForAddress);

// Restricted api routes
router.post('/api', signatureAuth, CommentLogic.addItem);
router.delete('/api/:id', signatureAuth, CommentLogic.verifyAuthor, CommentLogic.removeItem);

module.exports = router;
