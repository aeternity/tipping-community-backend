const express = require('express');
const app = express();
const exphbs  = require('express-handlebars');
const cors = require('cors');

// VIEWS
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.json()); // for parsing application/json

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'OPTIONS']
}));

// ROUTES
app.use('/blacklist', require('./routes/blacklistRoutes.js'));
app.use('/comment', require('./routes/commentRoutes.js'));
app.use('/tiporder', require('./routes/tiporderRoutes.js'));

app.use((req, res) => {
  res.status(404);
});

console.log('Server listening at port', 3000);
app.listen(3000);

module.exports = app;
