const { verifyPersonalMessage, hash, decodeBase58Check } = require('@aeternity/aepp-sdk').Crypto;

const deterministicStringify = obj => JSON.stringify(obj, Object.keys(obj).sort());

const basicAuth = (req, res, next) => {
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

const signatureAuth = (req, res, next) => {
  const sendError = message => res.status(401).send({err: message}); // custom message
  if (!req.body.signature) return sendError('Missing field signature');
  if (!req.body.requestTimestamp) return sendError('Missing field requestTimestamp');
  if (!req.body.author && req.body.sender) return sendError('Missing field author or sender');
  if(req.body.requestTimestamp < Date.now() - 10 * 1000) return sendError('Request older than 10 seconds');

  try {
    const author = decodeBase58Check(req.body.author ? req.body.author.substring(3) : req.body.sender.substring(3));

    const bodyClone = { ...req.body };
    delete bodyClone.signature;

    const authString = hash(deterministicStringify(bodyClone));
    const signatureArray = Uint8Array.from(Buffer.from(req.body.signature, 'hex'));

    return verifyPersonalMessage(authString, signatureArray, author) ? next() : sendError('Invalid signature');
  } catch (err) {
    console.error(err);
    return sendError(err.message);
  }


};

module.exports = {
  basicAuth,
  signatureAuth,
  deterministicStringify,
};
