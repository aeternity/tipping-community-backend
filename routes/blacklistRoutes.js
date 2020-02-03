const Router = require('express').Router;
const { BlacklistEntry } = require('../utils/database.js');
const Logic = require('../logic/blacklistLogic.js');
const ae = require('../utils/aeternity.js');

const router = new Router();

const auth =(req, res, next) => {
  const auth = { login: process.env.AUTHENTICATION_USER, password: process.env.AUTHENTICATION_PASSWORD };
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }

  // Access denied...
  res.set('WWW-Authenticate', 'Basic realm="Please enter user and password."'); // change this
  res.status(401).send('Authentication required.'); // custom message
};

// Open api routes
router.get('/api', Logic.getAllItems);
router.get('/api/:id', Logic.getSingleItem);

// View routes
router.get('/', auth, async (req, res) => res.render('admin', {
  allItems: await Logic.augmentAllItems(await ae.callContract())
}));

// Restricted api routes
router.post('/api', auth, Logic.addItem);
router.delete('/api/:id', auth, Logic.removeItem);

module.exports = router;
