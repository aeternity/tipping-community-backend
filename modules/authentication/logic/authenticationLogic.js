import aeppSdk from "@aeternity/aepp-sdk";
import { v4 as uuidv4 } from "uuid";
import urlParser from "url";
import imageLogic from "../../media/logic/imageLogic.js";
import loggerFactory from "../../../utils/logger.js";
import actions from "../constants/actions.js";
const { verifyMessage, decodeBase58Check, hash } = aeppSdk.Crypto;
const logger = loggerFactory(import.meta.url);
const MemoryQueue = [];
const VERSION = "2-0-0";
const authenticationLogic = {
  basicAuth(req, res, next) {
    const auth = { login: process.env.AUTHENTICATION_USER, password: process.env.AUTHENTICATION_PASSWORD };
    const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
    const [login, password] = Buffer.from(b64auth, "base64").toString().split(":");
    if (login && password && login === auth.login && password === auth.password) {
      return next();
    }
    // Access denied...
    res.set("WWW-Authenticate", 'Basic realm="Please enter user and password."'); // change this
    return res.status(401).send("Authentication required."); // custom message
  },
  async signatureAuth(req, res, next) {
    const sendError = (message) => res.status(401).send({ err: message });
    // Filter expired items (10 mins timer)
    // use delete to avoid race condition while overwriting
    MemoryQueue.forEach(({ timestamp, file }, index) => {
      if (timestamp < Date.now() - 5 * 60 * 1000) {
        delete MemoryQueue[index];
        try {
          if (file) imageLogic.deleteImage(file.filename);
        } catch (e) {
          logger.error(`Could not delete file:${e.message}`);
        }
      }
    });
    const { signature, challenge } = { ...req.body, ...req.params, ...req.query };
    if (signature || challenge) {
      try {
        if (!signature) return sendError("Missing field signature");
        if (!challenge) return sendError("Missing field challenge");
        // Find item
        // MemoryQueue probably has a significant list deleted items
        const queueItem = MemoryQueue.find((item) => (item || {}).challenge === challenge);
        if (!queueItem) return sendError("Could not find challenge (maybe it already expired?)");
        const { challenge: originalChallenge, body, files, method, url } = queueItem;
        // Verify that the challenge was issued for this method + path
        if (req.method !== method) return sendError("Challenge was issued for a different http method");
        if (urlParser.parse(req.originalUrl).pathname !== url) return sendError("Challenge was issued for a different path");
        // The public key can either be
        // body.author --> Comment route or POST profile
        // params.author --> profile route
        // we have to verify req.params.author first
        const publicKey = req.params.author ? req.params.author : body.author;
        if (!publicKey) sendError("Could not find associated public key");
        const author = decodeBase58Check(publicKey.substring(3));
        const authString = Buffer.from(originalChallenge);
        const signatureArray = Uint8Array.from(Buffer.from(signature, "hex"));
        const validRequest = verifyMessage(authString, signatureArray, author);
        if (validRequest) {
          // Remove challenge from active queue
          const queueIndex = MemoryQueue.findIndex((item) => (item || {}).challenge === req.body.challenge);
          delete MemoryQueue[queueIndex];
          // forward request and merge current body onto existing
          req.body = { ...{ signature, challenge }, ...body };
          if (files) req.files = files;
          return next();
        }
        return sendError("Invalid signature");
      } catch (err) {
        return sendError(err.message);
      }
    } else {
      if (!req.body.author && !req.params.author) return sendError("Missing field author in body or url");
      const uuid = uuidv4();
      try {
        const action = actions.find(({ method, path: currentPath }) => method === req.method && req.originalUrl.match(currentPath));
        if (!action) return sendError("Could not find valid action related to this request");
        const { actionName, relevantFields, getFullEntry } = action;
        const existingEntry = getFullEntry ? await getFullEntry(req) : {};
        const files = req.files
          ? Object.keys(req.files).reduce((acc, curr) => {
              acc[curr] = hash(imageLogic.readImage(req.files[curr][0].filename)).toString("hex");
              return acc;
            }, {})
          : {};
        const mergedObject = {
          author: req.params.author,
          ...existingEntry,
          ...req.body,
          ...files,
        };
        const payload = relevantFields.reduce((acc, fieldIndex) => `${acc};${fieldIndex}=${mergedObject[fieldIndex]}`, "");
        // UUID-RelevantFieldHash-Action-Timestamp
        const newChallenge = `${uuid}-${hash(payload).toString("hex")}-${actionName}-${Date.now()}-${VERSION}`;
        MemoryQueue.push({
          challenge: newChallenge,
          body: req.body,
          method: req.method,
          url: urlParser.parse(req.originalUrl).pathname,
          files: req.files ? req.files : null,
          timestamp: Date.now(),
        });
        return res.send({
          challenge: newChallenge,
          payload,
        });
      } catch (e) {
        logger.error(e);
        return sendError(e.message);
      }
    }
  },
};
export default authenticationLogic;
