const { Router } = require('express');
const EventLogic = require('../logic/eventLogic');

const router = new Router();
/**
 * @swagger
 * /events:
 *   get:
 *     tags:
 *       - cache
 *     summary: Returns all chain events related to the tipping contracts
 *     parameters:
 *       - in: query
 *         name: address
 *         description: caller address to filter the events by
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: event
 *         description: Event type to filter the events by
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         description: max amount of events returned
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Returns an sorted list of all tip events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/', async (req, res) => {
  res.send(await EventLogic.getAllEvents(req.params.address, req.params.event, req.params.limit));
});

module.exports = router;
