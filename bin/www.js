#!/usr/bin/env node
const http = require('http');
const Sentry = require('@sentry/node');

const app = require('../server');
const logger = require('../utils/logger')(module);
const aeternity = require('../modules/aeternity/logic/aeternity');
const cache = require('../modules/cache/utils/cache');
const broker = require('../modules/queue/logic/messageBrokerLogic');
const queueLogic = require('../modules/queue/logic/queueLogic');
const cacheLogic = require('../modules/cache/logic/cacheLogic');
const SchedulerLogic = require('../modules/queue/logic/schedulerLogic');
const chainListenerLogic = require('../modules/aeternity/logic/chainListenerLogic');
const ipfsLogic = require('../modules/backup/logic/ipfsLogic');
const linkPreviewLogic = require('../modules/linkPreview/logic/linkPreviewLogic');
const tipLogic = require('../modules/tip/logic/tipLogic');
const profileLogic = require('../modules/profile/logic/profileLogic');
const EventLogic = require('../modules/event/logic/eventLogic');

process
  .on('unhandledRejection', reason => {
    if (process.env.SENTRY_URL) Sentry.captureException(reason);
    logger.error(reason);
  })
  .on('uncaughtException', err => {
    if (process.env.SENTRY_URL) Sentry.captureException(err);
    logger.error(err);
  });

function normalizePort(value) {
  return typeof value === 'string' ? parseInt(value, 10) : value;
}
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

// Create HTTP server.
const server = http.createServer(app);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      return process.exit(1);
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      return process.exit(1);
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Listening on ${bind}`);
}

const startup = async () => {
  // first initialize aeternity sdk and cache before starting server
  await queueLogic.init();
  await broker.init();
  await aeternity.init();
  await cache.init(aeternity);
  cacheLogic.init();
  chainListenerLogic.startInvalidator();
  linkPreviewLogic.init();
  ipfsLogic.init();
  tipLogic.init();
  profileLogic.init();
  EventLogic.init();
  SchedulerLogic.init();

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
};

startup();
