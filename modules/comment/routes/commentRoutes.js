const { Router } = require('express');
const CommentLogic = require('../logic/commentLogic');
const { signatureAuth } = require('../../authentication/logic/authenticationLogic');

const router = new Router();
/**
 * @swagger
 * tags:
 * - name: "comment"
 *   description: "Comments on tips"
 */

/**
 * @swagger
 * /comment/api/{commentId}:
 *   get:
 *     tags:
 *       - comment
 *     summary: Returns a single comment
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         description: comment id in the backend
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Returns a single comment
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Comment'
 */
router.get('/api/:id', async (req, res) => {
  const result = await CommentLogic.fetchSingleComment(req.params.id);
  return result ? res.send(result) : res.sendStatus(404);
});
/**
 * @swagger
 * /comment/api/tip/{tipId}:
 *   get:
 *     tags:
 *       - comment
 *     summary: Returns all comments for single tip
 *     parameters:
 *       - in: path
 *         name: tipId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns all comments for single tip
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get('/api/tip/:tipId', async (req, res) => {
  res.send(await CommentLogic.fetchCommentsForTip(req.params.tipId));
});
/**
 * @swagger
 * /comment/api/author/{author}:
 *   get:
 *     tags:
 *       - comment
 *     summary: Returns all comments for single author
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns all comments for single author
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get('/api/author/:author', async (req, res) => {
  res.send(await CommentLogic.fetchCommentsForAuthor(req.params.author));
});

// Restricted api routes
/**
 * @swagger
 * /comment/api:
 *   post:
 *     tags:
 *       - comment
 *     summary: Add a new comment
 *     security:
 *       - signatureAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/Comment-signature-challenge-hierarchyLevel'
 *               - $ref: '#/components/schemas/SignatureRequest'
 *     responses:
 *       200:
 *         description: Add a new comment
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                - $ref: '#/components/schemas/Comment'
 *                - $ref: '#/components/schemas/SignatureResponse'
 */
router.post('/api', signatureAuth, async (req, res) => {
  const {
    tipId, text, author, signature, challenge, parentId,
  } = req.body;
  try {
    const result = await CommentLogic.addItem(tipId, text, author, signature, challenge, parentId);
    res.send(result);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
/**
 * @swagger
 * /comment/api/{commentId}:
 *   delete:
 *     tags:
 *       - comment
 *     summary: Delete a comment
 *     security:
 *       - signatureAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delete a comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SignatureResponse'
 */
router.delete('/api/:id', signatureAuth, CommentLogic.verifyAuthor, async (req, res) => {
  const result = await CommentLogic.removeItem(req.params.id);
  res.send(result === 1 ? res.sendStatus(200) : res.sendStatus(404));
});

module.exports = router;
