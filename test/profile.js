//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

const expect = chai.expect;
const { Profile, IPFSEntry, Comment } = require('../models');
const { signPersonalMessage, generateKeyPair, hash } = require('@aeternity/aepp-sdk').Crypto;
const fs = require('fs');
const BackupLogic = require('../logic/backupLogic');
const ae = require('../utils/aeternity.js');
const sinon = require('sinon');

chai.use(chaiHttp);
//Our parent block
describe('Profile', () => {

  const { publicKey, secretKey } = generateKeyPair();

  const testData = {
    biography: 'What an awesome bio',
    preferredChainName: 'awesomename.chain',
    referrer: 'ak_aNTSYaqHmuSfKgBPjBm95eJz82JXKznCZVdchKKKh7jtDAJcW',
    author: publicKey,
  };

  const signChallenge = (challenge, privateKey = null) => {
    if (!privateKey) privateKey = secretKey;
    const signatureBuffer = signPersonalMessage(
      challenge,
      Buffer.from(privateKey, 'hex'),
    );
    return Buffer.from(signatureBuffer).toString('hex');
  };

  before(async () => { //Before all tests we empty the database once
    await Comment.destroy({
      where: {},
      truncate: true,
    });
    await Profile.destroy({
      where: {},
      truncate: true,
    });
    await IPFSEntry.destroy({
      where: {},
      truncate: true,
    });
  });

  describe('Profile API', () => {
    it('it should 404 on non existing profile', (done) => {
      chai.request(server).get('/profile/' + publicKey).end((err, res) => {
        res.should.have.status(404);
        done();
      });
    });

    it('it should return a signature challenge', (done) => {
      chai.request(server).post('/profile/').send(testData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        done();
      });
    });

    it('it should fail with invalid signature', (done) => {
      chai.request(server).post('/profile/').send(testData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        chai.request(server).post('/profile/').send({ challenge, signature: 'wrong' }).end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('err', 'bad signature size');
          done();
        });
      });
    });

    it('it should fail on invalid challenge', (done) => {
      chai.request(server).post('/profile/').send(testData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge);
        chai.request(server).post('/profile/').send({
          challenge: challenge.substring(2),
          signature,
        }).end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('err', 'Could not find challenge (maybe it already expired?)');
          done();
        });
      });
    });

    it('it should CREATE a new profile', (done) => {

      const stub = sinon.stub(ae, 'getChainNamesByAddress').callsFake(function () {
        return [{
            name: testData.preferredChainName
          },
        ];
      });

      chai.request(server).post('/profile/').send(testData).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge);
        chai.request(server).post('/profile/').send({ challenge, signature }).end((err, res) => {
          res.should.have.status(200);
          console.log(res.body);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', testData.biography);
          res.body.should.have.property('author', testData.author);
          res.body.should.have.property('preferredChainName', testData.preferredChainName);
          res.body.should.have.property('referrer', testData.referrer);
          res.body.should.have.property('signature', signature);
          res.body.should.have.property('challenge', challenge);
          res.body.should.have.property('createdAt');
          res.body.createdAt.should.contain('Z');
          res.body.should.have.property('updatedAt');
          res.body.updatedAt.should.contain('Z');
          stub.called.should.be.true;
          stub.restore();
          done();
        });
      });
    });

    it('it should GET a profile', (done) => {
      chai.request(server).get('/profile/' + publicKey).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('biography', testData.biography);
        res.body.should.have.property('author', testData.author);
        res.body.should.have.property('referrer', true);
        res.body.should.have.property('signature');
        res.body.should.have.property('challenge');
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        done();
      });
    });

    it('it should reject creation for someone elses public key', (done) => {
      chai.request(server).post('/profile/')
        .send({
          biography: 'new bio',
          author: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
        }).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge);
        chai.request(server).post('/profile/').send({
          challenge: challenge,
          signature,
        }).end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('err', 'Invalid signature');
          done();
        });
      });
    });

    const newBio = 'another updated bio'
    it('it should allow to update an profile', (done) => {
      chai.request(server).post('/profile/')
        .send({ author: testData.author, biography: newBio })
        .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('challenge');
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge);
        chai.request(server).post('/profile/').send({
          challenge,
          signature,
        }).end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', newBio);
          done();
        });
      });
    });

    it('it should GET a profile with updated bio', (done) => {
      chai.request(server).get('/profile/' + publicKey).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('biography', newBio);
        res.body.should.have.property('author', testData.author);
        res.body.should.have.property('referrer', true);
        res.body.should.have.property('signature');
        res.body.should.have.property('challenge');
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        done();
      });
    });

    // Disabled for now
    it.skip('it should DELETE a profile', (done) => {
      chai.request(server)
        .delete('/profile/' + publicKey)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('challenge');
          const challenge = res.body.challenge;
          const signature = signChallenge(challenge);
          chai.request(server).delete('/profile/' + publicKey).send({
            challenge: challenge,
            signature,
          }).end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            done();
          });
        });
    });

    // Disabled for now
    it.skip('it should 404 on getting a deleted item', (done) => {
      chai.request(server).get('/profile/' + publicKey).end((err, res) => {
        res.should.have.status(404);
        done();
      });
    });
  });

  describe('Profile Image API', () => {

    before((done) => {
      fs.readdirSync('images')
        .filter(fileName => fileName.includes('ak_'))
        .map(file => fs.unlinkSync('images/' + file));

      Profile.destroy({
        where: {},
        truncate: true,
      }).then(() =>
        Profile.create({
          ...testData,
          signature: 'signature',
          challenge: 'challenge',
        }).then(() => done()));
    });

    const binaryParser = function (res, cb) {
      res.setEncoding('binary');
      res.data = '';
      res.on('data', function (chunk) {
        res.data += chunk;
      });
      res.on('end', function () {
        cb(null, Buffer.from(res.data, 'binary'));
      });
    };

    it('it should return 404 when no profile pic', (done) => {
      chai.request(server).get('/profile/image/' + publicKey)
        .end(function (err, res) {
          if (err) {
            done(err);
          }
          res.should.have.status(404);
          done();
        });
    });

    it('it should allow an image upload on existing profile', (done) => {
      chai.request(server).post('/profile/image/' + publicKey)
        .field('Content-Type', 'multipart/form-data')
        .attach('image', './test/test.png')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('challenge');
          const challenge = res.body.challenge;
          const signature = signChallenge(challenge);
          chai.request(server).post('/profile/image/' + publicKey).send({
            challenge: challenge,
            signature,
          }).end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('biography', testData.biography);
            res.body.should.have.property('author', testData.author);
            res.body.should.have.property('image', true);
            res.body.should.have.property('signature');
            res.body.should.have.property('challenge');
            res.body.should.have.property('imageSignature').not.null;
            res.body.should.have.property('imageChallenge').not.null;
            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');
            done();
          });
        });
    });

    it('it should allow an image upload on new profile', (done) => {
      const { publicKey, secretKey } = generateKeyPair();
      chai.request(server).post('/profile/image/' + publicKey)
        .field('Content-Type', 'multipart/form-data')
        .attach('image', './test/test.png')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('challenge');
          const challenge = res.body.challenge;
          const signature = signChallenge(challenge, secretKey);
          chai.request(server).post('/profile/image/' + publicKey).send({
            challenge: challenge,
            signature,
          }).end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('biography');
            res.body.should.have.property('author', publicKey);
            res.body.should.have.property('image', true);
            res.body.should.have.property('signature');
            res.body.should.have.property('challenge');
            res.body.should.have.property('imageSignature').not.null;
            res.body.should.have.property('imageChallenge').not.null;
            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');
            done();
          });
        });
    });

    it('it should allow an image upload on new profile', (done) => {
      const { publicKey, secretKey } = generateKeyPair();
      chai.request(server).post('/profile/image/' + publicKey)
        .field('Content-Type', 'multipart/form-data')
        .attach('image', './test/test.png')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('challenge');
          const challenge = res.body.challenge;
          const signature = signChallenge(challenge, secretKey);
          chai.request(server).post('/profile/image/' + publicKey).send({
            challenge: challenge,
            signature,
          }).end((err, res) => {
            res.should.have.status(200);
            done();
          });
        });
    });

    let ipfsHash = null;

    it('it should create an ipfs entry when uploading a new profile picture', async () => {
      const entry = await IPFSEntry.findOne({
        where: {
          type: BackupLogic.types.PROFILE_IMAGE,
          reference: publicKey,
        },
        raw: true,
      });
      entry.should.be.an('object');
      entry.should.have.property('id');
      entry.should.have.property('hash');
      entry.should.have.property('type', BackupLogic.types.PROFILE_IMAGE);
      entry.should.have.property('reference', publicKey);
      entry.should.have.property('createdAt');
      entry.should.have.property('updatedAt');
      ipfsHash = entry.hash;
    });

    it('it should GET an profile with image', (done) => {
      chai.request(server).get('/profile/' + publicKey)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('biography', testData.biography);
          res.body.should.have.property('author', testData.author);
          res.body.should.have.property('image', true);
          res.body.should.have.property('signature');
          res.body.should.have.property('challenge');
          res.body.should.have.property('imageSignature').not.null;
          res.body.should.have.property('imageChallenge').not.null;
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');
          done();
        });
    });

    it('it should GET an profile image', (done) => {
      chai.request(server).get('/profile/image/' + publicKey)
        .buffer()
        .parse(binaryParser)
        .end(function (err, res) {
          if (err) {
            done(err);
          }
          res.should.have.status(200);

          // Check the headers for type and size
          res.should.have.header('content-type');
          res.header['content-type'].should.be.equal('image/png');
          res.should.have.header('content-length');
          const size = fs.statSync('test/test.png').size.toString();
          res.header['content-length'].should.be.equal(size);

          // verify checksum
          expect(hash(res.body).toString('hex')).to.equal('03fd3b41a8312dfe558f9e48927ba7f2bca55fbfca7f5dae4145bc7a26fed2d5');
          done();
        });
    });

    it('it should allow overwriting an image', (done) => {
      chai.request(server).post('/profile/image/' + publicKey)
        .field('Content-Type', 'multipart/form-data')
        .attach('image', './test/test.png')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('challenge');
          const challenge = res.body.challenge;
          const signature = signChallenge(challenge);
          chai.request(server).post('/profile/image/' + publicKey).send({
            challenge: challenge,
            signature,
          }).end((err, res) => {
            res.should.have.status(200);
            done();
          });
        });
    });

    it('it should create a new ipfs entry when uploading a new profile picture', async () => {
      const entries = await IPFSEntry.findAll({
        where: {
          type: BackupLogic.types.PROFILE_IMAGE,
          reference: publicKey,
        },
        raw: true,
      });
      entries.should.be.an('array');
      entries.should.have.length(2);
      entries[0].hash.should.equal(entries[1].hash);
    });

    it('it should delete image', (done) => {
      chai.request(server).delete('/profile/image/' + publicKey)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('challenge');
          const challenge = res.body.challenge;
          const signature = signChallenge(challenge);
          chai.request(server).delete('/profile/image/' + publicKey).send({
            challenge: challenge,
            signature,
          }).end((err, res) => {
            res.should.have.status(200);
            done();
          });
        });
    });

    it('it should return no image after deletion ', (done) => {
      chai.request(server).get('/profile/' + publicKey)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('image', false);
          res.body.should.have.property('imageSignature').null;
          res.body.should.have.property('imageChallenge').null;
          done();
        });
    });

    it('it should return 404 after deleting a profile image', (done) => {
      chai.request(server).get('/profile/image/' + publicKey)
        .end(function (err, res) {
          if (err) {
            done(err);
          }
          res.should.have.status(404);
          done();
        });
    });
  });
})
;
