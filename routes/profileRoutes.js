const multer = require('multer');
const { Router } = require('express');
const path = require('path');
const ProfileLogic = require('../logic/profileLogic.js');
const { signatureAuth } = require('../utils/auth.js');

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
router.get('/:author', ProfileLogic.getSingleItem);
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
 *                 - $ref: '#/components/schemas/SignatureRequest'
 */
router.post(
  '/:author',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  signatureAuth,
  ProfileLogic.verifyRequest,
  ProfileLogic.upsertProfile,
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
 *     responses:
 *       200:
 *         description: Returns a profile image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/image/:author', ProfileLogic.getImage);

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
 *                 - $ref: '#/components/schemas/SignatureRequest'
 */
router.post(
  '/image/:author',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  signatureAuth,
  ProfileLogic.verifyRequest,
  ProfileLogic.upsertProfile,
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
 *                 - $ref: '#/components/schemas/SignatureRequest'
 */
router.delete(
  '/image/:author',
  signatureAuth,
  ProfileLogic.verifyRequest,
  ProfileLogic.deleteImage,
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
 *                 - $ref: '#/components/schemas/SignatureRequest'
 */
router.post(
  '/',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  signatureAuth,
  ProfileLogic.verifyRequest,
  ProfileLogic.upsertProfile,
);

module.exports = router;
