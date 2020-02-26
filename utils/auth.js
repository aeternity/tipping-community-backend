const { verifyPersonalMessage, hash, decodeBase58Check } = require('@aeternity/aepp-sdk').Crypto;
const uuidv4 = require('uuid/v4');

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

const MemoryQueue = [];

const signatureAuth = (req, res, next) => {
  const sendError = message => res.status(401).send({ err: message });

  if (req.body.signature || req.body.challenge) {
    try {
      if (!req.body.signature) return sendError('Missing field signature');
      if (!req.body.challenge) return sendError('Missing field challenge');

      const queueItem = MemoryQueue.find(item => item.challenge === req.body.challenge);
      if (!queueItem) return sendError('Could not find challenge');
      const { challenge, body } = queueItem;

      const publicKey = body.author ? body.author : (body.sender ? body.sender : body.address);
      const author = decodeBase58Check(publicKey.substring(3));

      const authString = Buffer.from(challenge);
      const signatureArray = Uint8Array.from(Buffer.from(req.body.signature, 'hex'));

      const validRequest = verifyPersonalMessage(authString, signatureArray, author);
      if (validRequest) {
        req.body = body;
        return next();
      } else {
        return sendError('Invalid signature');
      }
    } catch (err) {
      return sendError(err.message);
    }
  } else {
    if (!req.body.author && !req.body.sender && !req.body.address) return sendError('Missing field author or sender or address');
    const uuid = uuidv4();
    MemoryQueue.push({
      challenge: uuid,
      body: req.body,
    });
    return res.send({
      challenge: uuid,
    });
  }
};

module.exports = {
  basicAuth,
  signatureAuth,
  deterministicStringify,
};
