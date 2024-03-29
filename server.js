const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const path = require('path');
require('express-async-errors');

const app = express();
const exphbs = require('express-handlebars');
const cors = require('cors');
const OpenApiValidator = require('express-openapi-validator');

// Require util to add asyncMap
require('./modules/aeternity/utils/util');
const logger = require('./utils/logger')(module);

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
const hbs = exphbs.create({
  // Specify helpers which are only registered on this instance.
  helpers: {
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString();
    },
    pages(length, block) {
      let acc = '';
      for (let i = 1; i <= length; ++i) acc += block.fn(i);
      return acc;
    },
    isSelected(value, selected) {
      return value === selected ? 'selected' : '';
    },
  },
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, './modules/blacklist/views'));
// MIDDLEWARES
app.use(express.json()); // for parsing application/json

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// expose api docs
if (fs.existsSync('./swagger.json')) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(JSON.parse(fs.readFileSync('./swagger.json'))));
  app.use(
    OpenApiValidator.middleware({
      apiSpec: './swagger.json',
      fileUploader: false,
      // Skip basic auth test for now until this is fixed in the validation package
      // https://github.com/cdimascio/express-openapi-validator/pull/563/files
      // TODO re-enable
      validateSecurity: false,
      // TODO take care of the errors
      // validateResponses: true, // <-- to validate responses
    }),
  );
} else {
  throw Error('Missing Swagger File. To create the file run: npm run swagger:create');
}

// ROUTES
app.use('/blacklist', require('./modules/blacklist/routes/blacklistRoutes'));
app.use('/comment', require('./modules/comment/routes/commentRoutes'));
app.use('/linkpreview', require('./modules/linkPreview/routes/linkPreviewRoutes'));
app.use('/verified', require('./modules/domains/routes/verifiedRoutes'));
app.use('/cache', require('./modules/cache/routes/cacheRoutes'));
app.use('/tokenCache', require('./modules/token/routes/tokenCacheRoutes'));
app.use('/claim', require('./modules/payfortx/routes/payForTxRoutes'));
app.use('/payfortx', require('./modules/payfortx/routes/payForTxRoutes'));
app.use('/static', require('./modules/domains/routes/staticRoutes'));
app.use('/profile', require('./modules/profile/routes/profileRoutes'));
app.use('/errorreport', require('./modules/errorReport/routes/errorReportRoutes'));
app.use('/tracing', require('./modules/payfortx/routes/tipTracingRoutes'));
app.use('/health', require('./modules/health/routes/healthRoutes'));
app.use('/pin', require('./modules/pin/routes/pinRoutes'));
app.use('/notification', require('./modules/notification/routes/notificationRoutes'));
app.use('/consent', require('./modules/consent/routes/consentRoutes'));

app.use('/images', require('./modules/media/routes/imageRoutes'));
app.use('/tips', require('./modules/tip/routes/tipRoutes'));
app.use('/stats', require('./modules/stats/routes/statsRoutes'));

if (process.env.SENTRY_URL) {
  // log errors that come from controllers
  app.use(Sentry.Handlers.errorHandler());
}

// catch errors
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (!err.status || err.status >= 500) {
    Sentry.captureException(err);
    logger.error(err);
  }
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors,
    });
  }
});

// catch 404
app.use((req, res) => {
  if (!res.headersSent) res.sendStatus(404);
});

module.exports = app;
