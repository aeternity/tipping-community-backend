const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const cors = require('cors');
const Logger = require('./utils/logger.js');
const logger = new Logger('main');
// VIEWS
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.json()); // for parsing application/json

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
app.use('/claim', require('./routes/payForTxRoutes.js'));
app.use('/logs', require('./routes/loggerRoutes.js'));
app.use('/static', require('./routes/staticRoutes.js'));
app.use('/profile', require('./routes/profileRoutes.js'));
app.use('/errorreport', require('./routes/errorReportRoutes.js'));
app.use('/trace', require('./routes/traceRoutes.js'));
app.use('/tracing', require('./routes/tipTracingRoutes.js'));

app.use((req, res) => {
  res.sendStatus(404);
});

app.listen(3000, () => {
  logger.log({ message: 'Server started' });
});

module.exports = app;
