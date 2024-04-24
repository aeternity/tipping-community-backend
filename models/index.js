import Sequelize$0 from "sequelize";
import sequelizeHierarchy from "sequelize-hierarchy";
import config from "../config/config.js";
import applyRelations from "./relations.js";

// get all models
import ChainName from "../modules/aeternity/models/chainName.js";
import IPFSEntry from "../modules/backup/models/ipfs.js";
import BlacklistEntry from "../modules/blacklist/models/blacklist.js";
import Comment from "../modules/comment/models/comment.js";
import Consent from "../modules/consent/models/consent.js";
import ErrorReport from "../modules/errorReport/models/errorReport.js";
import Event from "../modules/event/models/event.js";
import LinkPreview from "../modules/linkPreview/models/linkPreview.js";
import Notification from "../modules/notification/models/notification.js";
import Trace from "../modules/payfortx/models/trace.js";
import Pin from "../modules/pin/models/pin.js";
import Profile from "../modules/profile/models/profile.js";
import Claim from "../modules/tip/models/claim.js";
import Retip from "../modules/tip/models/retip.js";
import Tip from "../modules/tip/models/tip.js";

const { Sequelize, DataTypes } = Sequelize$0;
sequelizeHierarchy(Sequelize);

const db = {};
const sequelize = new Sequelize(config.development);

const models = {
  ChainName,
  IPFSEntry,
  BlacklistEntry,
  Comment,
  Consent,
  ErrorReport,
  Event,
  LinkPreview,
  Notification,
  Trace,
  Pin,
  Profile,
  Claim,
  Retip,
  Tip,
};

Object.entries(models).forEach(([modelName, model]) => {
  db[modelName] = model(sequelize, DataTypes);
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

applyRelations(db, sequelize, Sequelize.Op);
db.sequelize = sequelize;
db.Sequelize = Sequelize;
export default db;
