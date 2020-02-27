const { verifyPersonalMessage, decodeBase58Check } = require('@aeternity/aepp-sdk').Crypto;
const { v4: uuidv4 } = require('uuid');

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

      // Filter expired items (10 mins timer)
      // use delete to avoid race condition while overwriting
      MemoryQueue.map(({ timestamp }, index) => {
        if (timestamp < Date.now() - 5 * 60 * 1000) delete MemoryQueue[index]
      });

      // Find item
      // MemoryQueue probably has a significant list deleted items
      const queueItem = MemoryQueue.find(item => (item || {}).challenge === req.body.challenge);
      if (!queueItem) return sendError('Could not find challenge (maybe it already expired?)');
      const { challenge, body, file, method, url } = queueItem;

      // Verify that the challenge was issued for this method + path
      if(req.method !== method) return sendError('Challenge was issued for a different http method');
      if(req.originalUrl !== url) return sendError('Challenge was issued for a different path');

      // The public key can either be
      // body.author --> Comment route or POST profile
      // params.author --> profile route
      // we have to verify req.params.author first
      const publicKey = req.params.author ? req.params.author :  body.author;
      if (!publicKey) sendError('Could not find associated public key');
      const author = decodeBase58Check(publicKey.substring(3));

      const authString = Buffer.from(challenge);
      const signatureArray = Uint8Array.from(Buffer.from(req.body.signature, 'hex'));

      const validRequest = verifyPersonalMessage(authString, signatureArray, author);
      if (validRequest) {
        // Remove challenge from active queue
        const queueIndex = MemoryQueue.findIndex(item => (item || {}).challenge === req.body.challenge);
        delete MemoryQueue[queueIndex];
        // forward request
        req.body = body;
        if (file) req.file = file;
        return next();
      } else {
        return sendError('Invalid signature');
      }
    } catch (err) {
      return sendError(err.message);
    }
  } else {
    if (!req.body.author && !req.params.author) return sendError('Missing field author in body or url');
    const uuid = uuidv4();
    MemoryQueue.push({
      challenge: uuid,
      body: req.body,
      method: req.method,
      url: req.originalUrl,
      file: req.file ? req.file : null,
      timestamp: Date.now(),
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
