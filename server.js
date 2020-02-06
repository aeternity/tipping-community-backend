const express = require('express');
const app = express();
const exphbs  = require('express-handlebars');

// VIEWS
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.json()); // for parsing application/json

// ROUTES
app.use('/blacklist', require('./routes/blacklistRoutes.js'));
app.use('/tiporder', require('./routes/tiporderRoutes.js'));

app.use((req, res) => {
  res.status(404);
});

console.log('Server listening at port', 3000);
app.listen(3000);

module.exports = app;
