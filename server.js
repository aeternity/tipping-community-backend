const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const path = require('path');

const app = express();
const exphbs = require('express-handlebars');
const cors = require('cors');
const logger = require('./utils/logger')(module);
const aeternity = require('./modules/aeternity/logic/aeternity');
const cache = require('./modules/cache/utils/cache');

// SENTRY
if (process.env.SENTRY_URL) {
  Sentry.init({
    dsn: process.env.SENTRY_URL,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 0.003,
  });

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler({
    user: false,
    ip: false,
    request: ['headers', 'method', 'query_string', 'url'],
  }));
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
}
// VIEWS
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, './modules/blacklist/views'));
// MIDDLWARES
app.use(express.json()); // for parsing application/json

process
  .on('unhandledRejection', reason => {
    if (process.env.SENTRY_URL) Sentry.captureException(reason);
    logger.error(reason);
  })
  .on('uncaughtException', err => {
    if (process.env.SENTRY_URL) Sentry.captureException(err);
    logger.error(err);
  });

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// ROUTES
app.use('/blacklist', require('./modules/blacklist/routes/blacklistRoutes.js'));
app.use('/comment', require('./modules/comment/routes/commentRoutes.js'));
app.use('/linkpreview', require('./modules/linkPreview/routes/linkPreviewRoutes.js'));
app.use('/verified', require('./modules/domains/routes/verifiedRoutes.js'));
app.use('/cache', require('./modules/cache/routes/cacheRoutes.js'));
app.use('/tokenCache', require('./modules/token/routes/tokenCacheRoutes.js'));
app.use('/claim', require('./modules/payfortx/routes/payForTxRoutes.js'));
app.use('/payfortx', require('./modules/payfortx/routes/payForTxRoutes.js'));
app.use('/static', require('./modules/domains/routes/staticRoutes.js'));
app.use('/profile', require('./modules/profile/routes/profileRoutes.js'));
app.use('/errorreport', require('./modules/errorReport/routes/errorReportRoutes.js'));
app.use('/tracing', require('./modules/payfortx/routes/tipTracingRoutes.js'));
app.use('/health', require('./modules/health/routes/healthRoutes.js'));
app.use('/pin', require('./modules/pin/routes/pinRoutes.js'));
app.use('/notification', require('./modules/notification/routes/notificationRoutes.js'));
app.use('/consent', require('./modules/consent/routes/consentRoutes.js'));

app.use('/images', require('./modules/media/routes/imageRoutes.js'));

// expose api docs
if (fs.existsSync('./swagger.json')) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(JSON.parse(fs.readFileSync('./swagger.json'))));
}

if (process.env.SENTRY_URL) {
  // log errors that come from controllers
  app.use(Sentry.Handlers.errorHandler());
}

// catch errors
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).send({ error: err });
});

// catch 404
app.use((req, res) => {
  res.sendStatus(404);
});

// first initialize aeternity sdk and cache before starting server
const startup = async () => {
  await aeternity.init();
  await cache.init(aeternity);

  app.listen(3000, () => {
    logger.info('Server started');
  });
};

startup();

module.exports = app;
