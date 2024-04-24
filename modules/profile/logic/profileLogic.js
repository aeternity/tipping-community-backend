import BackupLogic from "../../backup/logic/backupLogic.js";
import aeternity from "../../aeternity/logic/aeternity.js";
import cache from "../../cache/utils/cache.js";
import imageLogic from "../../media/logic/imageLogic.js";
import CacheLogic from "../../cache/logic/cacheLogic.js";
import models from "../../../models/index.js";
import { IPFS_TYPES } from "../../backup/constants/ipfsTypes.js";
import queueLogic from "../../queue/logic/queueLogic.js";
import { MESSAGE_QUEUES, MESSAGES } from "../../queue/constants/queue.js";

const { Profile } = models;
const ProfileLogic = {
  init() {
    queueLogic.subscribeToMessage(MESSAGE_QUEUES.PROFILE, MESSAGES.PROFILE.COMMANDS.UPDATE_PREFERRED_CHAIN_NAMES, async (message) => {
      await ProfileLogic.verifyPreferredChainNames();
      await queueLogic.deleteMessage(MESSAGE_QUEUES.PROFILE, message.id);
    });
  },
  async upsertProfile({ author, biography, preferredChainName, referrer, location, signature, challenge, image, coverImage }) {
    const existing = await Profile.findOne({ where: { author }, raw: true });
    // Backup to IPFS
    if (existing) {
      await Profile.update(
        {
          ...(typeof biography !== "undefined" && { biography }),
          ...(typeof preferredChainName !== "undefined" && { preferredChainName }),
          ...(typeof referrer !== "undefined" && { referrer }),
          ...(typeof location !== "undefined" && { location }),
          ...(typeof image !== "undefined" && { image: image[0].filename }),
          ...(typeof coverImage !== "undefined" && { coverImage: coverImage[0].filename }),
          signature,
          challenge,
        },
        { where: { author } },
      );
      if (image && existing.image && existing.image !== image[0].filename) imageLogic.deleteImage(existing.image);
      if (coverImage && existing.coverImage && existing.coverImage !== coverImage[0].filename) imageLogic.deleteImage(existing.coverImage);
    } else {
      await Profile.create({
        author,
        biography,
        preferredChainName,
        referrer,
        signature,
        challenge,
        image: image ? image[0].filename : null,
        coverImage: coverImage ? coverImage[0].filename : null,
        location,
      });
      // Kill stats cache
      await cache.del(["StaticLogic.getStats"]);
    }
    if (image && image[0].filename !== null) {
      await BackupLogic.backupImageToIPFS(image[0].filename, author, IPFS_TYPES.PROFILE_IMAGE);
    }
    if (coverImage && coverImage[0].filename !== null) {
      await BackupLogic.backupImageToIPFS(coverImage[0].filename, author, IPFS_TYPES.COVER_IMAGE);
    }
    return ProfileLogic.updateProfileForExternalAnswer(await ProfileLogic.getSingleItem(author));
  },
  // TODO run this via message queue when chain names are updated
  async verifyPreferredChainNames() {
    const allProfiles = await Profile.findAll({ raw: true });
    const chainNames = await CacheLogic.fetchMdwChainNames();
    return allProfiles.asyncMap(async (profile) => {
      if (profile.preferredChainName && (!chainNames[profile.author] || !chainNames[profile.author].includes(profile.preferredChainName))) {
        await Profile.update({ preferredChainName: null }, { where: { author: profile.author } });
      }
    });
  },
  async getSingleItem(author) {
    let profile = await Profile.findOne({ where: { author }, raw: true });
    if (!profile) profile = { author, createdAt: "" };
    if (!profile.preferredChainName) {
      profile.preferredChainName = await CacheLogic.fetchMdwChainNames().then((chainNames) => (chainNames[author] ? chainNames[author][0] : null));
    }
    return profile;
  },
  updateProfileForExternalAnswer(profile) {
    return {
      ...profile,
      image: profile.image ? `/images/${profile.image}` : false,
      coverImage: profile.coverImage ? `/images/${profile.coverImage}` : false,
      referrer: !!profile.referrer,
    };
  },
  async getAllProfiles() {
    return Profile.findAll({ raw: true });
  },
  // LEGACY
  async deleteImage(req, res) {
    const result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result || !result.image) return res.sendStatus(404);
    imageLogic.deleteImage(result.image);
    await Profile.update(
      {
        image: null,
        imageSignature: null,
        imageChallenge: null,
      },
      { where: { author: req.params.author }, raw: true },
    );
    return res.sendStatus(200);
  },
  async getImagePath(author) {
    const result = await Profile.findOne({ where: { author }, raw: true });
    if (!result || !result.image) return null;
    return imageLogic.getImagePath(result.image);
  },
  async verifyRequest(req, res, next) {
    // Get author
    const author = req.params.author ? req.params.author : req.body.author;
    if (!author) return res.status(400).send({ err: "Missing author" });
    // No chain name
    if (typeof req.body.preferredChainName === "undefined") return next();
    const queryResult = await aeternity.getAddressForChainName(req.body.preferredChainName);
    let addresses = [];
    if (queryResult) addresses = queryResult.pointers.filter(({ key }) => key === "account_pubkey").map(({ id }) => id);
    // check if chain name points to author
    return addresses.includes(author) ? next() : res.status(400).send({ err: "Chainname does not point to author" });
  },
};
export default ProfileLogic;
