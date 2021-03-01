const multer = require('multer');
const { Router } = require('express');
const path = require('path');
const profileLogic = require('../logic/profileLogic');
const { signatureAuth } = require('../../authentication/logic/authenticationLogic');

const router = new Router();
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'images/');
  },
  filename(req, file, cb) {
    cb(null, `${req.params.author}-${Date.now()}${path.extname(file.originalname)}`); // Appending extension
  },
});
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 * - name: "profile"
 *   description: "User Profiles"
 */

/**
 * @swagger
 * /profile/{author}:
 *   get:
 *     tags:
 *       - profile
 *     summary: Returns a profile for a single user
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a profile for a single user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 */
router.get('/:author', async (req, res) => {
  const author = req.body.author ? req.body.author : req.params.author;
  const result = await profileLogic.getSingleItem(author);
  if (!result) return res.sendStatus(404);
  return res.send(profileLogic.updateProfileForExternalAnswer(result));
});
/**
 * @swagger
 * /profile/{author}:
 *   post:
 *     tags:
 *       - profile
 *     summary: Creates / Updates a profile
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/Profile-author-signature-challenge'
 *               - $ref: '#/components/schemas/SignatureRequest'
 *     responses:
 *       200:
 *         description: Creates / Updates a profile
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Profile'
 *                 - $ref: '#/components/schemas/SignatureResponse'
 */
router.post(
  '/:author',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  signatureAuth,
  profileLogic.verifyRequest,
  (req, res) => profileLogic.upsertProfile(req, res),
);

// Image routes
/**
 * @swagger
 * /profile/image/{author}:
 *   get:
 *     tags:
 *       - profile
 *     summary: Returns a link preview image
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cacheBust
 *         description: Pass any random string to bypass the browser cache
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a profile image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/image/:author', profileLogic.getImage);

// Legacy routes
/**
 * @swagger
 * /profile/image/{author}:
 *   post:
 *     tags:
 *       - profile
 *     deprecated: true
 *     summary: Creates / Updates a profile
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Profile-author-signature-challenge'
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/SignatureRequest'
 *     responses:
 *       200:
 *         description: Creates / Updates a profile
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Profile'
 *                 - $ref: '#/components/schemas/SignatureResponse'
 */
router.post(
  '/image/:author',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  signatureAuth,
  profileLogic.verifyRequest,
  (req, res) => profileLogic.upsertProfile(req, res),
);
/**
 * @swagger
 * /profile/image/{author}:
 *   delete:
 *     tags:
 *       - profile
 *     deprecated: true
 *     summary: Creates / Updates a profile
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Creates / Updates a profile
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Profile'
 *                 - $ref: '#/components/schemas/SignatureResponse'
 */
router.delete(
  '/image/:author',
  signatureAuth,
  profileLogic.verifyRequest,
  (req, res) => profileLogic.deleteImage(req, res),
);
/**
 * @swagger
 * /profile:
 *   post:
 *     tags:
 *       - profile
 *     deprecated: true
 *     summary: Creates / Updates a profile
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Profile'
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/SignatureRequest'
 *     responses:
 *       200:
 *         description: Creates / Updates a profile
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Profile'
 *                 - $ref: '#/components/schemas/SignatureResponse'
 */
router.post(
  '/',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  signatureAuth,
  profileLogic.verifyRequest,
  (req, res) => profileLogic.upsertProfile(req, res),
);

module.exports = router;
