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
  methods: ['GET', 'POST', 'OPTIONS'],
}));

// ROUTES
app.use('/blacklist', require('./routes/blacklistRoutes.js'));
app.use('/comment', require('./routes/commentRoutes.js'));
app.use('/tiporder', require('./routes/tiporderRoutes.js'));
app.use('/linkpreview', require('./routes/linkPreviewRoutes.js'));
app.use('/verified', require('./routes/verifiedRoutes.js'));
app.use('/cache', require('./routes/cacheRoutes.js'));
app.use('/language', require('./routes/languageRoutes.js'));
app.use('/claim', require('./routes/payForTxRoutes.js'));
app.use('/logs', require('./routes/loggerRoutes.js'));

app.use((req, res) => {
  res.sendStatus(404);
});

console.log('Server listening at port', 3000);
app.listen(3000, () => {
  logger.log({ message: 'Server started' });
});

module.exports = app;
