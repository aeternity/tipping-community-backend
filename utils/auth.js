const { verifyPersonalMessage, decodeBase58Check, hash } = require('@aeternity/aepp-sdk').Crypto;
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { Profile } = require('../models');

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
const actions = [
  {
    method: 'POST',
    path: '\/comment\/api\/?',
    actionName: 'CREATE_COMMENT',
    relevantFields: ['text'],
  },
  {
    method: 'POST',
    path: '\/profile\/?$',
    actionName: 'CREATE_PROFILE',
    relevantFields: ['biography', 'preferredChainName'],
  },
  {
    method: 'POST',
    path: '\/profile\/image\/ak_',
    actionName: 'CREATE_PROFILE_IMAGE',
    relevantFields: [],
    hasFile: true,
  },
  {
    method: 'POST',
    path: '\/blacklist\/api\/wallet',
    actionName: 'CREATE_FLAGGED_TIP',
    relevantFields: ['tipId'],
    hasFile: false,
  },
  {
    method: 'PUT',
    path: '\/profile\/ak_',
    actionName: 'UPDATE_PROFILE',
    relevantFields: ['biography', 'preferredChainName'],
    getFullEntry: async (req) => Profile.findOne({where: {author: req.params.author}})
  },
  {
    method: 'DELETE',
    path: '\/comment\/api\/.*',
    actionName: 'DELETE_COMMENT',
    relevantFields: [],
  },
  {
    method: 'DELETE',
    path: '\/profile\/ak_.*',
    actionName: 'DELETE_PROFILE',
    relevantFields: [],
  },
  {
    method: 'DELETE',
    path: '\/profile\/image\/ak_.*',
    actionName: 'DELETE_PROFILE_IMAGE',
    relevantFields: [],
  }];

const signatureAuth = async (req, res, next) => {
  const sendError = message => res.status(401).send({ err: message });

  // Filter expired items (10 mins timer)
  // use delete to avoid race condition while overwriting
  MemoryQueue.map(({ timestamp, file }, index) => {
    if (timestamp < Date.now() - 5 * 60 * 1000) {
      delete MemoryQueue[index];
      try {
        if (file) fs.unlinkSync(path.resolve(__dirname, '../images/', file.filename));
      } catch (e) {
        console.error('Could not delete file:' + e.message);
      }
    }
  });

  if (req.body.signature || req.body.challenge) {
    try {
      if (!req.body.signature) return sendError('Missing field signature');
      if (!req.body.challenge) return sendError('Missing field challenge');


      // Find item
      // MemoryQueue probably has a significant list deleted items
      const queueItem = MemoryQueue.find(item => (item || {}).challenge === req.body.challenge);
      if (!queueItem) return sendError('Could not find challenge (maybe it already expired?)');
      const { challenge, body, file, method, url } = queueItem;

      // Verify that the challenge was issued for this method + path
      if (req.method !== method) return sendError('Challenge was issued for a different http method');
      if (req.originalUrl !== url) return sendError('Challenge was issued for a different path');

      // The public key can either be
      // body.author --> Comment route or POST profile
      // params.author --> profile route
      // we have to verify req.params.author first
      const publicKey = req.params.author ? req.params.author : body.author;
      if (!publicKey) sendError('Could not find associated public key');
      const author = decodeBase58Check(publicKey.substring(3));

      const authString = Buffer.from(challenge);
      const signatureArray = Uint8Array.from(Buffer.from(req.body.signature, 'hex'));

      const validRequest = verifyPersonalMessage(authString, signatureArray, author);
      if (validRequest) {
        // Remove challenge from active queue
        const queueIndex = MemoryQueue.findIndex(item => (item || {}).challenge === req.body.challenge);
        delete MemoryQueue[queueIndex];
        // forward request and merge current body onto existing
        req.body = Object.assign({}, req.body, body);
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
    try {
      const action = actions
        .find(({ method, path }) => method === req.method && req.originalUrl.match(path));
      if (!action) return sendError('Could not find valid action related to this request');
      const { actionName, relevantFields, hasFile, getFullEntry } = action;

      let payload;
      if(getFullEntry) {
        // MERGE EXISTING ENTRY WITH CURRENT (PUT)
        const fullEntry = await getFullEntry(req);
        const mergedObject = Object.assign({}, fullEntry, req.body)
        payload = relevantFields.reduce((acc, fieldIndex) => `${acc};${fieldIndex}=${mergedObject[fieldIndex]}`, '');
      } else if (!hasFile) {
        // JUST USE REMOTE ENTRY (POST)
        payload = relevantFields.reduce((acc, fieldIndex) => `${acc};${fieldIndex}=${req.body[fieldIndex]}`, '');
      } else {
        // REQUEST HAS A FILE
        if (!req.file) return sendError('Could not find any image in your request.');
        payload = fs.readFileSync(path.resolve(__dirname, '../images/', req.file.filename));
      }
      // UUID-RelevantFieldHash-Action-Timestamp
      const challenge = `${uuid}-${actionName.indexOf('DELETE') === 0 ? '' : hash(payload).toString('hex')}-${actionName}-${Date.now()}`;
      MemoryQueue.push({
        challenge,
        body: req.body,
        method: req.method,
        url: req.originalUrl,
        file: req.file ? req.file : null,
        timestamp: Date.now(),
      });
      return res.send({
        challenge,
        payload: hasFile ? 'file' : payload,
      });
    } catch (e) {
      console.error(e);
      return sendError(e.message);
    }
  }
};

module.exports = {
  basicAuth,
  signatureAuth,
};
