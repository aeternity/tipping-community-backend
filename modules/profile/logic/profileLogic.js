const logger = require('../../../utils/logger')(module);
const BackupLogic = require('../../backup/logic/backupLogic');
const aeternity = require('../../aeternity/logic/aeternity');
const cache = require('../../cache/utils/cache');
const imageLogic = require('../../media/logic/imageLogic');
const CacheLogic = require('../../cache/logic/cacheLogic');
const { Profile } = require('../../../models');
const { IPFS_TYPES } = require('../../backup/constants/ipfsTypes');
const queue = require('../../queue/logic/queueLogic');
const { MESSAGE_QUEUES, MESSAGES } = require('../../queue/constants/queue');

class ProfileLogic {
  constructor() {
    queue.subscribeToMessage(MESSAGE_QUEUES.PROFILE, MESSAGES.PROFILE.COMMANDS.UPDATE_PREFERRED_CHAIN_NAMES,
      async message => {
        await this.verifyPreferredChainNames();
        await queue.deleteMessage(MESSAGE_QUEUES.PROFILE, message.id);
      });
  }

  async upsertProfile(req, res) {
    try {
      const {
        biography, preferredChainName, referrer, location, signature, challenge,
      } = req.body;
      let { image, coverImage } = (req.files ? req.files : {});
      // allow image deletion
      if (!image && req.body.image === null) image = [{ filename: null }];
      if (!coverImage && req.body.coverImage === null) coverImage = [{ filename: null }];
      // get author
      const author = req.body.author ? req.body.author : req.params.author;
      if (!author) return res.status(400).send('Missing required field author');
      const existing = await Profile.findOne({ where: { author }, raw: true });
      // Backup to IPFS
      if (existing) {
        await Profile.update({
          ...(typeof biography !== 'undefined') && { biography },
          ...(typeof preferredChainName !== 'undefined') && { preferredChainName },
          ...(typeof referrer !== 'undefined') && { referrer },
          ...(typeof location !== 'undefined') && { location },
          ...(typeof image !== 'undefined') && { image: image[0].filename },
          ...(typeof coverImage !== 'undefined') && { coverImage: coverImage[0].filename },
          signature,
          challenge,
        }, { where: { author } });
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
        await cache.del(['StaticLogic.getStats']);
      }
      if (image && image[0].filename !== null) {
        await BackupLogic.backupImageToIPFS(image[0].filename, author, IPFS_TYPES.PROFILE_IMAGE);
      }
      if (coverImage && coverImage[0].filename !== null) {
        await BackupLogic.backupImageToIPFS(coverImage[0].filename, author, IPFS_TYPES.COVER_IMAGE);
      }
      return res.send(this.updateProfileForExternalAnswer(await this.getSingleItem(author)));
    } catch (e) {
      logger.error(e);
      return res.status(500).send(e.message);
    }
  }

  // TODO run this via message queue when chain names are updated
  async verifyPreferredChainNames() {
    const allProfiles = await Profile.findAll({ raw: true });
    const chainNames = await CacheLogic.fetchChainNames();
    return allProfiles.asyncMap(async profile => {
      if (profile.preferredChainName && (
        !chainNames[profile.author] || !chainNames[profile.author].includes(profile.preferredChainName)
      )) {
        await Profile.update({ preferredChainName: null }, { where: { author: profile.author } });
      }
    });
  }

  async getSingleItem(author) {
    return Profile.findOne({ where: { author }, raw: true });
  }

  updateProfileForExternalAnswer(profile) {
    return {
      ...profile,
      image: profile.image ? `/images/${profile.image}` : false,
      coverImage: profile.coverImage ? `/images/${profile.coverImage}` : false,
      referrer: !!profile.referrer,
    };
  }

  async getAllProfiles() {
    return Profile.findAll({ raw: true });
  }

  // LEGACY
  async deleteImage(req, res) {
    const result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result || !result.image) return res.sendStatus(404);
    imageLogic.deleteImage(result.image);
    await Profile.update({
      image: null,
      imageSignature: null,
      imageChallenge: null,
    }, { where: { author: req.params.author }, raw: true });
    return res.sendStatus(200);
  }

  async getImage(req, res) {
    const result = await Profile.findOne({ where: { author: req.params.author }, raw: true });
    if (!result || !result.image) return res.sendStatus(404);
    try {
      return res.sendFile(imageLogic.getImagePath(result.image));
    } catch (e) {
      logger.error(e.message);
      return res.sendStatus(500);
    }
  }

  async verifyRequest(req, res, next) {
    // Get author
    const author = req.params.author ? req.params.author : req.body.author;
    if (!author) return res.status(400).send({ err: 'Missing author' });

    // No chain name
    if (typeof req.body.preferredChainName === 'undefined') return next();

    const queryResult = await aeternity.getAddressForChainName(req.body.preferredChainName);
    let addresses = [];
    if (queryResult) addresses = queryResult.pointers.filter(({ key }) => key === 'account_pubkey').map(({ id }) => id);
    // check if chain name points to author
    return addresses.includes(author) ? next() : res.status(400).send({ err: 'Chainname does not point to author' });
  }
}

const profileLogic = new ProfileLogic();
module.exports = profileLogic;
