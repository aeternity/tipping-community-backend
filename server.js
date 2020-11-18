const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

const app = express();
const exphbs = require('express-handlebars');
const cors = require('cors');
const logger = require('./utils/logger')(module);
const aeternity = require('./utils/aeternity');
const cache = require('./utils/cache');

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
    tracesSampleRate: 1.0,
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
app.use('/blacklist', require('./routes/blacklistRoutes.js'));
app.use('/comment', require('./routes/commentRoutes.js'));
app.use('/linkpreview', require('./routes/linkPreviewRoutes.js'));
app.use('/verified', require('./routes/verifiedRoutes.js'));
app.use('/cache', require('./routes/cacheRoutes.js'));
app.use('/tokenCache', require('./routes/tokenCacheRoutes.js'));
app.use('/claim', require('./routes/payForTxRoutes.js'));
app.use('/payfortx', require('./routes/payForTxRoutes.js'));
app.use('/static', require('./routes/staticRoutes.js'));
app.use('/profile', require('./routes/profileRoutes.js'));
app.use('/errorreport', require('./routes/errorReportRoutes.js'));
app.use('/tracing', require('./routes/tipTracingRoutes.js'));
app.use('/health', require('./routes/healthRoutes.js'));
app.use('/pin', require('./routes/pinRoutes.js'));
app.use('/notification', require('./routes/notificationRoutes.js'));
app.use('/consent', require('./routes/consentRoutes.js'));

app.use('/images', require('./routes/imageRoutes.js'));

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
