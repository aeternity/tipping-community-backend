#!/usr/bin/env node
import "dotenv/config";
import http from "http";
import Sentry from "@sentry/node";
import app from "../server.js";
import loggerFactory from "../utils/logger.js";
import aeternity from "../modules/aeternity/logic/aeternity.js";
import cache from "../modules/cache/utils/cache.js";
import broker from "../modules/queue/logic/messageBrokerLogic.js";
import queueLogic from "../modules/queue/logic/queueLogic.js";
import cacheLogic from "../modules/cache/logic/cacheLogic.js";
import SchedulerLogic from "../modules/queue/logic/schedulerLogic.js";
import chainListenerLogic from "../modules/aeternity/logic/chainListenerLogic.js";
import ipfsLogic from "../modules/backup/logic/ipfsLogic.js";
import linkPreviewLogic from "../modules/linkPreview/logic/linkPreviewLogic.js";
import tipLogic from "../modules/tip/logic/tipLogic.js";
import profileLogic from "../modules/profile/logic/profileLogic.js";
import EventLogic from "../modules/event/logic/eventLogic.js";
import MdWLogic from "../modules/aeternity/logic/mdwLogic.js";
import ImageLogic from "../modules/media/logic/imageLogic.js";
// Load environment variables
const logger = loggerFactory(import.meta.url);
process
  .on("unhandledRejection", (reason) => {
    if (process.env.SENTRY_URL) Sentry.captureException(reason);
    logger.error(reason);
  })
  .on("uncaughtException", (err) => {
    if (process.env.SENTRY_URL) Sentry.captureException(err);
    logger.error(err);
  });
function normalizePort(value) {
  return typeof value === "string" ? parseInt(value, 10) : value;
}
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);
// Create HTTP server.
const server = http.createServer(app);
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
    case "EACCES":
      logger.error(`${bind} requires elevated privileges`);
      return process.exit(1);
    case "EADDRINUSE":
      logger.error(`${bind} is already in use`);
      return process.exit(1);
    default:
      throw error;
  }
}
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Listening on ${bind}`);
}
const startup = async () => {
  await queueLogic.init();
  await broker.init();
  await aeternity.init();
  await cache.init(aeternity);
  cacheLogic.init();
  chainListenerLogic.startInvalidator();
  linkPreviewLogic.init();
  ipfsLogic.init();
  tipLogic.init();
  profileLogic.init();
  EventLogic.init();
  SchedulerLogic.init();
  MdWLogic.init();
  ImageLogic.init();
  server.listen(port);
  server.on("error", onError);
  server.on("listening", onListening);
};
startup();
