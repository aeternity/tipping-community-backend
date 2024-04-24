import express from "express";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import Sentry from "@sentry/node";
import Tracing from "@sentry/tracing";
import "express-async-errors";
import exphbs from "express-handlebars";
import cors from "cors";
import OpenApiValidator from "express-openapi-validator";
import "./modules/aeternity/utils/util.js";
import loggerFactory from "./utils/logger.js";
import blacklistRoutes from "./modules/blacklist/routes/blacklistRoutes.js";
import commentRoutes from "./modules/comment/routes/commentRoutes.js";
import linkPreviewRoutes from "./modules/linkPreview/routes/linkPreviewRoutes.js";
import verifiedRoutes from "./modules/domains/routes/verifiedRoutes.js";
import cacheRoutes from "./modules/cache/routes/cacheRoutes.js";
import tokenCacheRoutes from "./modules/token/routes/tokenCacheRoutes.js";
import payForTxRoutes from "./modules/payfortx/routes/payForTxRoutes.js";
import staticRoutes from "./modules/domains/routes/staticRoutes.js";
import profileRoutes from "./modules/profile/routes/profileRoutes.js";
import errorReportRoutes from "./modules/errorReport/routes/errorReportRoutes.js";
import tipTracingRoutes from "./modules/payfortx/routes/tipTracingRoutes.js";
import healthRoutes from "./modules/health/routes/healthRoutes.js";
import pinRoutes from "./modules/pin/routes/pinRoutes.js";
import notificationRoutes from "./modules/notification/routes/notificationRoutes.js";
import consentRoutes from "./modules/consent/routes/consentRoutes.js";
import imageRoutes from "./modules/media/routes/imageRoutes.js";
import tipRoutes from "./modules/tip/routes/tipRoutes.js";
import statsRoutes from "./modules/stats/routes/statsRoutes.js";
const app = express();
const logger = loggerFactory(import.meta.url);
// SENTRY
if (process.env.SENTRY_URL) {
  Sentry.init({
    dsn: process.env.SENTRY_URL,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 0.003,
  });
  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(
    Sentry.Handlers.requestHandler({
      user: false,
      ip: false,
      request: ["headers", "method", "query_string", "url"],
    }),
  );
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
}
// VIEWS
const hbs = exphbs.create({
  // Specify helpers which are only registered on this instance.
  helpers: {
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString();
    },
    pages(length, block) {
      let acc = "";
      for (let i = 1; i <= length; ++i) acc += block.fn(i);
      return acc;
    },
    isSelected(value, selected) {
      return value === selected ? "selected" : "";
    },
  },
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", "./modules/blacklist/views");
// MIDDLEWARES
app.use(express.json()); // for parsing application/json
app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
// expose api docs
if (fs.existsSync("./swagger.json")) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(JSON.parse(fs.readFileSync("./swagger.json"))));
  app.use(
    OpenApiValidator.middleware({
      apiSpec: "./swagger.json",
      fileUploader: false,
      // Skip basic auth test for now until this is fixed in the validation package
      // https://github.com/cdimascio/express-openapi-validator/pull/563/files
      // TODO re-enable
      validateSecurity: false,
      // TODO take care of the errors
      // validateResponses: true, // <-- to validate responses
    }),
  );
} else {
  throw Error("Missing Swagger File. To create the file run: npm run swagger:create");
}
// ROUTES
app.use("/blacklist", blacklistRoutes);
app.use("/comment", commentRoutes);
app.use("/linkpreview", linkPreviewRoutes);
app.use("/verified", verifiedRoutes);
app.use("/cache", cacheRoutes);
app.use("/tokenCache", tokenCacheRoutes);
app.use("/claim", payForTxRoutes);
app.use("/payfortx", payForTxRoutes);
app.use("/static", staticRoutes);
app.use("/profile", profileRoutes);
app.use("/errorreport", errorReportRoutes);
app.use("/tracing", tipTracingRoutes);
app.use("/health", healthRoutes);
app.use("/pin", pinRoutes);
app.use("/notification", notificationRoutes);
app.use("/consent", consentRoutes);
app.use("/images", imageRoutes);
app.use("/tips", tipRoutes);
app.use("/stats", statsRoutes);
if (process.env.SENTRY_URL) {
  // log errors that come from controllers
  app.use(Sentry.Handlers.errorHandler());
}
// catch errors
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (!err.status || err.status >= 500) {
    Sentry.captureException(err);
    logger.error(err);
  }
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors,
    });
  }
});
// catch 404
app.use((req, res) => {
  if (!res.headersSent) res.sendStatus(404);
});
export default app;
