const { Router } = require('express');
const ErrorReportLogic = require('../logic/errorReportLogic');
const { basicAuth } = require('../../authentication/logic/authenticationLogic');

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
 * /errorreport:
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
router.get('/', basicAuth, async (req, res) => {
  res.send(await ErrorReportLogic.getAllReports());
});

/**
 * @swagger
 * /errorreport:
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
router.post('/', async (req, res) => {
  const {
    appVersion, browser, error, time, platform, description,
  } = req.body;
  const result = await ErrorReportLogic.addItem({
    appVersion, browser, error, time, platform, description,
  });
  return res.send(result);
});

module.exports = router;
