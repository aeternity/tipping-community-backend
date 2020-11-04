const { Router } = require('express');
const Logic = require('../logic/errorReportLogic.js');
const { basicAuth } = require('../utils/auth.js');

const router = new Router();
/**
 * @swagger
 * tags:
 * - name: "errorreport"
 *   description: "Stores error reports from the wallet"
 */
// View routes
/**
 * @swagger
 * /errorreport/:
 *   get:
 *     tags:
 *       - errorreport
 *     summary: Gets all reported errors
 *     security:
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: Gets all reported errors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ErrorReport'
 */
router.get('/', basicAuth, Logic.getAllItems);

// Restricted api routes
/**
 * @swagger
 * /errorreport/:
 *   post:
 *     tags:
 *       - errorreport
 *     summary: Add a new error report
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorReport'
 *     responses:
 *       200:
 *         description: Add a new error report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorReport'
 */
router.post('/', Logic.addItem);

module.exports = router;
