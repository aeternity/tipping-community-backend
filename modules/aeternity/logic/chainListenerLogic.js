import websocket from "websocket";
import loggerFactory from "../../../utils/logger.js";
import aeternity from "./aeternity.js";
import CacheLogic from "../../cache/logic/cacheLogic.js";
import queueLogic from "../../queue/logic/queueLogic.js";
import { MESSAGES } from "../../queue/constants/queue.js";
import { MESSAGE_QUEUES } from "../../queue/constants/queue.js";
const WebSocketClient = websocket.client;
const logger = loggerFactory(import.meta.url);
let wsconnection = null;
const wsclient = new WebSocketClient();
// Check if all envs are defined
if (!process.env.WEBSOCKET_URL) throw new Error("WEBSOCKET_URL is not set");
const handleContractEvent = async (event, tx) => {
  await queueLogic.sendMessage(MESSAGE_QUEUES.BLOCKCHAIN, MESSAGES.BLOCKCHAIN.EVENTS.EVENT_RECEIVED, { event, tx });
};
const subscribeToContract = (contract) => {
  if (!wsconnection) throw new Error("init ws connection first");
  logger.info(`Subscribing to events from ${contract}`);
  wsconnection.send(
    JSON.stringify({
      op: "Subscribe",
      payload: "Object",
      target: contract,
    }),
  );
};
const handleWebsocketMessage = async (message) => {
  if (message.type === "utf8" && message.utf8Data.includes("payload")) {
    const data = JSON.parse(message.utf8Data);
    if (data.subscription === "Object") {
      const tx = await CacheLogic.getTx(data.payload.hash);
      const events = await aeternity.decodeTransactionEvents({
        ...data.payload,
        tx: {
          ...data.payload.tx,
          log: tx.log,
        },
      });
      if (events.length > 0) {
        events.map((event) => handleContractEvent(event, tx));
      }
    }
  }
};
const handleConnectionInit = async (connection) => {
  logger.info("WebSocket connected");
  wsconnection = connection;
  if (process.env.CONTRACT_V1_ADDRESS) subscribeToContract(process.env.CONTRACT_V1_ADDRESS);
  if (process.env.CONTRACT_V2_ADDRESS) subscribeToContract(process.env.CONTRACT_V2_ADDRESS);
  if (process.env.CONTRACT_V3_ADDRESS) subscribeToContract(process.env.CONTRACT_V3_ADDRESS);
  if (process.env.WORD_REGISTRY_CONTRACT) subscribeToContract(process.env.WORD_REGISTRY_CONTRACT);
  wsconnection.on("message", handleWebsocketMessage);
  wsconnection.on("error", (error) => {
    logger.error(`Connection Error: ${error.toString()}`);
  });
  wsconnection.on("close", (closeCode, closeReason) => {
    if (closeCode === 1006) {
      // eslint-disable-next-line no-use-before-define
      connectToWebsocket();
    } else {
      logger.error(`Websocket closed with code: ${closeCode} and reason: ${closeReason}`);
    }
  });
};
const connectToWebsocket = () => {
  wsclient.connect(process.env.WEBSOCKET_URL);
};
const startInvalidator = () => {
  connectToWebsocket();
  wsclient.on("connectFailed", (e) => logger.error(e));
  wsclient.on("connect", handleConnectionInit);
};
export { startInvalidator };
export default {
  startInvalidator,
};
