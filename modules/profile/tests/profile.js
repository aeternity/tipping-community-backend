// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { describe, it, before } = require('mocha');
const { generateKeyPair, hash } = require('@aeternity/aepp-sdk').Crypto;
const fs = require('fs');

const { Profile, IPFSEntry, Comment } = require('../../../models');
const server = require('../../../server');
const { IPFS_TYPES } = require('../../backup/constants/ipfsTypes');
const ae = require('../../aeternity/logic/aeternity');
const ipfs = require('../../backup/logic/ipfsLogic');
const profileLogic = require('../logic/profileLogic');
const queueLogic = require('../../queue/logic/queueLogic');
const { MESSAGES, MESSAGE_QUEUES } = require('../../queue/constants/queue');
const {
  publicKey,
  performSignedJSONRequest,
  performSignedMultipartFormRequest,
} = require('../../../utils/testingUtil');

const { expect } = chai;

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Profile', () => {
  const testData = {
    biography: 'What an awesome bio',
    preferredChainName: 'awesomename.chain',
    referrer: 'ak_aNTSYaqHmuSfKgBPjBm95eJz82JXKznCZVdchKKKh7jtDAJcW',
    location: 'awesome, location, country',
  };
  const testImagePath = './modules/profile/tests/test.png';

  before(async () => { // Before all tests we empty the database once
    await Comment.destroy({
      where: {},
      truncate: true,
      cascade: true,
    });
    await Profile.destroy({
      where: {},
      truncate: true,
      cascade: true,
    });
    await IPFSEntry.destroy({
      where: {},
      truncate: true,
    });
  });

  describe('Profile API', () => {
    it('it should fallback to empty profile on non existing profile', done => {
      chai.request(server).get(`/profile/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('author', publicKey);
        res.body.should.have.property('createdAt');
        done();
      });
    });

    it('it should CREATE a new profile', done => {
      const stub = sinon.stub(ae, 'getAddressForChainName').callsFake(() => ({
        pointers: [{ id: publicKey, key: 'account_pubkey' }],
      }));
      performSignedJSONRequest(server, 'post', `/profile/${publicKey}`, testData)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', testData.biography);
          res.body.should.have.property('author', publicKey);
          res.body.should.have.property('preferredChainName', testData.preferredChainName);
          res.body.should.have.property('referrer', true);
          res.body.should.have.property('location', testData.location);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('createdAt');
          res.body.createdAt.should.contain('Z');
          res.body.should.have.property('updatedAt');
          res.body.updatedAt.should.contain('Z');
          stub.called.should.equal(true);
          stub.restore();
          done();
        });
    });

    it('it should GET a profile', done => {
      chai.request(server).get(`/profile/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('biography', testData.biography);
        res.body.should.have.property('author', publicKey);
        res.body.should.have.property('referrer', true);
        res.body.should.have.property('location', testData.location);
        res.body.should.have.property('signature');
        res.body.should.have.property('challenge');
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        done();
      });
    });

    const newBio = 'another updated bio';
    it('it should allow to update an profile', done => {
      performSignedJSONRequest(server, 'post', `/profile/${publicKey}`, {
        biography: newBio,
      }).then(({ res }) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('biography', newBio);
        done();
      });
    });

    it('it should GET a profile with updated bio', done => {
      chai.request(server).get(`/profile/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('biography', newBio);
        res.body.should.have.property('author', publicKey);
        done();
      });
    });
  });

  describe('Profile Image API', () => {
    before(async () => {
      fs.readdirSync('images')
        .filter(fileName => fileName.includes('ak_'))
        .map(file => fs.unlinkSync(`images/${file}`));

      await Profile.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });
      await Profile.create({
        ...testData,
        author: publicKey,
        signature: 'signature',
        challenge: 'challenge',
      });
      await ipfs.init();
    });

    const binaryParser = function (res, cb) {
      res.setEncoding('binary');
      res.data = '';
      res.on('data', chunk => {
        res.data += chunk;
      });
      res.on('end', () => {
        cb(null, Buffer.from(res.data, 'binary'));
      });
    };

    it('it should return 404 when no profile pic', done => {
      chai.request(server).get(`/profile/image/${publicKey}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(404);
          done();
        });
    });

    it('it should allow an image upload on existing profile', done => {
      performSignedMultipartFormRequest(server, 'post', `/profile/${publicKey}`, 'image', testImagePath)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', testData.biography);
          res.body.should.have.property('author', publicKey);
          res.body.should.have.property('image');
          res.body.image.should.contain(`/images/${publicKey}`);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('imageSignature', null);
          res.body.should.have.property('imageChallenge', null);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('it should not overwrite an profile image if a cover image is uploaded', done => {
      performSignedMultipartFormRequest(server, 'post', `/profile/${publicKey}`, 'coverImage', testImagePath)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', testData.biography);
          res.body.should.have.property('author', publicKey);
          res.body.should.have.property('image');
          res.body.coverImage.should.contain(`/images/${publicKey}`);
          res.body.should.have.property('coverImage');
          res.body.coverImage.should.contain(`/images/${publicKey}`);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('imageSignature', null);
          res.body.should.have.property('imageChallenge', null);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('it should allow an image upload on new profile', done => {
      const { publicKey: localPublicKey, secretKey } = generateKeyPair();
      performSignedMultipartFormRequest(server, 'post', `/profile/${localPublicKey}`, 'image', testImagePath, secretKey)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', null);
          res.body.should.have.property('author', localPublicKey);
          res.body.should.have.property('image');
          res.body.image.should.contain(`/images/${localPublicKey}`);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('imageSignature', null);
          res.body.should.have.property('imageChallenge', null);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('it should create an ipfs entry when uploading a new profile picture', async () => {
      const entry = await IPFSEntry.findOne({
        where: {
          type: IPFS_TYPES.PROFILE_IMAGE,
          reference: publicKey,
        },
        raw: true,
      });
      entry.should.be.an('object');
      entry.should.have.property('id');
      entry.should.have.property('hash');
      entry.should.have.property('type', IPFS_TYPES.PROFILE_IMAGE);
      entry.should.have.property('reference', publicKey);
      entry.should.have.property('createdAt');
      entry.should.have.property('updatedAt');
    });

    let imageURL = '';
    it('it should GET an profile with image', done => {
      chai.request(server).get(`/profile/${publicKey}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', testData.biography);
          res.body.should.have.property('author', publicKey);
          res.body.should.have.property('image');
          res.body.image.should.contain(`/images/${publicKey}`);
          imageURL = res.body.image;
          res.body.should.have.property('signature');
          res.body.should.have.property('challenge');
          res.body.should.have.property('imageSignature', null);
          res.body.should.have.property('imageChallenge', null);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('it should GET an profile image', done => {
      chai.request(server).get(imageURL)
        .buffer()
        .parse(binaryParser)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);

          // Check the headers for type and size
          res.should.have.header('content-type');
          res.header['content-type'].should.be.equal('image/png');
          res.should.have.header('content-length');
          const size = fs.statSync(testImagePath).size.toString();
          res.header['content-length'].should.be.equal(size);

          // verify checksum
          expect(hash(res.body).toString('hex')).to.equal('03fd3b41a8312dfe558f9e48927ba7f2bca55fbfca7f5dae4145bc7a26fed2d5');
          done();
        });
    });

    it('it should allow overwriting of the profile image', done => {
      performSignedMultipartFormRequest(server, 'post', `/profile/${publicKey}`, 'image', testImagePath)
        .then(({ res }) => {
          res.should.have.status(200);
          done();
        });
    });

    it('it should create a new ipfs entry when uploading a new profile picture', async () => {
      const entries = await IPFSEntry.findAll({
        where: {
          type: IPFS_TYPES.PROFILE_IMAGE,
          reference: publicKey,
        },
        raw: true,
      });
      // two entries
      // first from initial upload
      // second from re-upload of first user
      entries.should.be.an('array');
      entries.should.have.length(2);
      entries[0].hash.should.equal(entries[1].hash);
    });

    it('it should delete the image', done => {
      performSignedJSONRequest(server, 'post', `/profile/${publicKey}`, { image: null })
        .then(({ res }) => {
          res.should.have.status(200);
          done();
        });
    });

    it('it should return no image after deletion ', done => {
      chai.request(server).get(`/profile/${publicKey}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('image', false);
          done();
        });
    });

    it('it should return 404 after deleting a profile image', done => {
      chai.request(server).get(`/profile/image/${publicKey}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(404);
          done();
        });
    });
  });

  describe('Cover Image API', () => {
    before(async () => {
      fs.readdirSync('images')
        .filter(fileName => fileName.includes('ak_'))
        .map(file => fs.unlinkSync(`images/${file}`));

      await Profile.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });
      await Profile.create({
        ...testData,
        author: publicKey,
        signature: 'signature',
        challenge: 'challenge',
      });
    });

    const binaryParser = function (res, cb) {
      res.setEncoding('binary');
      res.data = '';
      res.on('data', chunk => {
        res.data += chunk;
      });
      res.on('end', () => {
        cb(null, Buffer.from(res.data, 'binary'));
      });
    };

    it('it should return 404 when no cover pic', done => {
      chai.request(server).get(`/profile/${publicKey}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.body.should.have.property('coverImage', false);
          done();
        });
    });

    it('it should allow an cover image upload on existing profile', done => {
      performSignedMultipartFormRequest(server, 'post', `/profile/${publicKey}`, 'coverImage', testImagePath)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', testData.biography);
          res.body.should.have.property('author', publicKey);
          res.body.should.have.property('coverImage');
          res.body.coverImage.should.contain(`/images/${publicKey}`);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('imageSignature', null);
          res.body.should.have.property('imageChallenge', null);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('it should not overwrite an coverImage if a profile image is uploaded', done => {
      performSignedMultipartFormRequest(server, 'post', `/profile/${publicKey}`, 'image', testImagePath)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', testData.biography);
          res.body.should.have.property('author', publicKey);
          res.body.should.have.property('image');
          res.body.coverImage.should.contain(`/images/${publicKey}`);
          res.body.should.have.property('coverImage');
          res.body.coverImage.should.contain(`/images/${publicKey}`);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('imageSignature', null);
          res.body.should.have.property('imageChallenge', null);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('it should allow an cover image upload on new profile', done => {
      const { publicKey: localPublicKey, secretKey } = generateKeyPair();
      performSignedMultipartFormRequest(server, 'post', `/profile/${localPublicKey}`, 'coverImage', testImagePath, secretKey)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', null);
          res.body.should.have.property('author', localPublicKey);
          res.body.should.have.property('coverImage');
          res.body.coverImage.should.contain(`/images/${localPublicKey}`);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('imageSignature', null);
          res.body.should.have.property('imageChallenge', null);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('it should create an ipfs entry when uploading a new cover picture', async () => {
      const entry = await IPFSEntry.findOne({
        where: {
          type: IPFS_TYPES.COVER_IMAGE,
          reference: publicKey,
        },
        raw: true,
      });
      entry.should.be.an('object');
      entry.should.have.property('id');
      entry.should.have.property('hash');
      entry.should.have.property('type', IPFS_TYPES.COVER_IMAGE);
      entry.should.have.property('reference', publicKey);
      entry.should.have.property('createdAt');
      entry.should.have.property('updatedAt');
    });

    let imageURL = '';
    it('it should GET an profile with a cover image', done => {
      chai.request(server).get(`/profile/${publicKey}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', testData.biography);
          res.body.should.have.property('author', publicKey);
          res.body.should.have.property('coverImage');
          res.body.coverImage.should.contain(`/images/${publicKey}`);
          imageURL = res.body.coverImage;
          res.body.should.have.property('signature');
          res.body.should.have.property('challenge');
          res.body.should.have.property('imageSignature', null);
          res.body.should.have.property('imageChallenge', null);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('it should GET an cover image', done => {
      chai.request(server).get(imageURL)
        .buffer()
        .parse(binaryParser)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);

          // Check the headers for type and size
          res.should.have.header('content-type');
          res.header['content-type'].should.be.equal('image/png');
          res.should.have.header('content-length');
          const size = fs.statSync(testImagePath).size.toString();
          res.header['content-length'].should.be.equal(size);

          // verify checksum
          expect(hash(res.body).toString('hex')).to.equal('03fd3b41a8312dfe558f9e48927ba7f2bca55fbfca7f5dae4145bc7a26fed2d5');
          done();
        });
    });

    it('it should allow overwriting of the cover image', done => {
      performSignedMultipartFormRequest(server, 'post', `/profile/${publicKey}`, 'coverImage', testImagePath)
        .then(({ res }) => {
          res.should.have.status(200);
          done();
        });
    });

    it('it should create a new ipfs entry when uploading a new cover picture', async () => {
      const entries = await IPFSEntry.findAll({
        where: {
          type: IPFS_TYPES.COVER_IMAGE,
          reference: publicKey,
        },
        raw: true,
      });
      // two entries
      // first from initial upload
      // second from coverImage
      // third from re-upload of first user
      entries.should.be.an('array');
      entries.should.have.length(3);
      entries[0].hash.should.equal(entries[1].hash);
    });

    it('it should delete the cover image', done => {
      performSignedJSONRequest(server, 'post', `/profile/${publicKey}`, { coverImage: null })
        .then(({ res }) => {
          res.should.have.status(200);
          done();
        });
    });

    it('it should return no image after deletion ', done => {
      chai.request(server).get(`/profile/${publicKey}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('coverImage', false);
          done();
        });
    });
  });

  describe('Legacy API', () => {
    const { publicKey: localPublicKey, secretKey } = generateKeyPair();

    it('it should CREATE a new profile', done => {
      const stub = sinon.stub(ae, 'getAddressForChainName').callsFake(() => ({
        pointers: [{ id: localPublicKey, key: 'account_pubkey' }],
      }));
      performSignedJSONRequest(server, 'post', '/profile/', {
        ...testData,
        author: localPublicKey,
      }, secretKey)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', testData.biography);
          res.body.should.have.property('author', localPublicKey);
          res.body.should.have.property('preferredChainName', testData.preferredChainName);
          res.body.should.have.property('referrer', true);
          res.body.should.have.property('location', testData.location);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('createdAt');
          res.body.createdAt.should.contain('Z');
          res.body.should.have.property('updatedAt');
          res.body.updatedAt.should.contain('Z');
          stub.called.should.equal(true);
          stub.restore();
          done();
        });
    });

    const newBio = 'another updated bio';
    it('it should allow to update an profile', done => {
      performSignedJSONRequest(server, 'post', '/profile/', {
        biography: newBio,
        author: localPublicKey,
      }, secretKey).then(({ res }) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('biography', newBio);
        done();
      });
    });

    it('POST /profile/image/ak_... (upload new image)', done => {
      performSignedMultipartFormRequest(server, 'post', `/profile/image/${localPublicKey}`, 'image', testImagePath, secretKey)
        .then(({ res, signature, challenge }) => {
          res.should.have.status(200);
          res.body.should.have.property('author', localPublicKey);
          res.body.should.have.property('image');
          res.body.image.should.contain(`/images/${localPublicKey}`);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('imageSignature', null);
          res.body.should.have.property('imageChallenge', null);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('DELETE /profile/image/ak_...', done => {
      performSignedJSONRequest(server, 'delete', `/profile/image/${localPublicKey}`, {}, secretKey)
        .then(({ res }) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
    });

    it('it should return no image after deletion ', done => {
      chai.request(server).get(`/profile/${localPublicKey}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('image', false);
          done();
        });
    });

    it('it should return 404 after deleting a profile image', done => {
      chai.request(server).get(`/profile/image/${localPublicKey}`)
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(404);
          done();
        });
    });
  });

  describe('Internals', () => {
    it('it should verify the chain names on message', done => {
      profileLogic.init();
      const updateMock = sinon.stub(profileLogic, 'verifyPreferredChainNames').callsFake(async () => {});
      queueLogic.sendMessage(MESSAGE_QUEUES.PROFILE, MESSAGES.PROFILE.COMMANDS.UPDATE_PREFERRED_CHAIN_NAMES);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        updateMock.restore();
        done();
      }, 100);
    });
  });
});
