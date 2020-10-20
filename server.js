const express = require('express');

const app = express();
const exphbs = require('express-handlebars');
const cors = require('cors');
const logger = require('./utils/logger')(module);
const aeternity = require('./utils/aeternity');
const cache = require('./utils/cache');

// VIEWS
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.json()); // for parsing application/json

process
  .on('unhandledRejection', reason => {
    logger.error(reason);
  })
  .on('uncaughtException', err => {
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
app.use('/static', require('./routes/staticRoutes.js'));
app.use('/profile', require('./routes/profileRoutes.js'));
app.use('/errorreport', require('./routes/errorReportRoutes.js'));
app.use('/tracing', require('./routes/tipTracingRoutes.js'));
app.use('/health', require('./routes/healthRoutes.js'));
app.use('/pin', require('./routes/pinRoutes.js'));
app.use('/notification', require('./routes/notificationRoutes.js'));
app.use('/consent', require('./routes/consentRoutes.js'));

app.use('/images', express.static('./images'));

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
