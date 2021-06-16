const { signPersonalMessage, generateKeyPair, hash } = require('@aeternity/aepp-sdk').Crypto;
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const sinon = require('sinon');
const aeternity = require('../modules/aeternity/logic/aeternity');
const TipLogic = require('../modules/tip/logic/tipLogic');

const { Tip } = require('../models');

chai.use(chaiHttp);

const { publicKey, secretKey } = generateKeyPair();

const signChallenge = (challenge, privateKey = null) => {
  const signatureBuffer = signPersonalMessage(
    challenge,
    Buffer.from(privateKey || secretKey, 'hex'),
  );
  return Buffer.from(signatureBuffer).toString('hex');
};

const shouldBeValidChallengeResponse = (serverBody, testData) => {
  serverBody.should.be.a('object');
  serverBody.should.have.property('challenge');
  serverBody.should.have.property('payload');
  Object.keys(testData).map(key => serverBody.payload.should.contain(`${key}=${testData[key]}`));
};

const performSignedMultipartFormRequest = (server, method, url, field, path, privateKey = null) => new Promise((resolve, reject) => {
  chai.request(server)[method](url)
    .field('Content-Type', 'multipart/form-data')
    .attach(field, path)
    .end((err, res) => {
      res.should.have.status(200);
      shouldBeValidChallengeResponse(res.body, {
        [field]: hash(fs.readFileSync(path)).toString('hex'),
      });
      const { challenge } = res.body;
      const signature = signChallenge(challenge, privateKey);
      chai.request(server)[method](url).send({
        challenge,
        signature,
      }).end((secondErr, secondRes) => {
        if (secondErr) return reject(secondErr);
        return resolve({ res: secondRes, signature, challenge });
      });
    });
});

const performSignedJSONRequest = (server, method, url, data = {}, privateKey = null) => new Promise((resolve, reject) => {
  chai.request(server)[method](url)
    .send(data)
    .end((err, res) => {
      res.should.have.status(200);
      shouldBeValidChallengeResponse(res.body, data);
      const { challenge } = res.body;
      const signature = signChallenge(challenge, privateKey);
      chai.request(server)[method](url)
        .send({ challenge, signature })
        .end((secondErr, secondRes) => {
          if (secondErr) return reject(secondErr);
          return resolve({ res: secondRes, signature, challenge });
        });
    });
});

const performSignedGETRequest = (server, url, privateKey = null) => new Promise((resolve, reject) => {
  chai.request(server).get(url)
    .end((err, res) => {
      res.should.have.status(200);
      const { challenge } = res.body;
      const signature = signChallenge(challenge, privateKey);
      chai.request(server).get(url)
        .query({ challenge, signature })
        .end((secondErr, secondRes) => {
          if (secondErr) return reject(secondErr);
          return resolve({ res: secondRes, signature, challenge });
        });
    });
});

const getDBSeedFunction = (dbsToClear = []) => async (fakeData, clearData = true) => {
  if (clearData) {
    await dbsToClear.asyncMap(async model => model.truncate({
      cascade: true,
    }));
    await Tip.truncate({
      cascade: true,
    });
  }
  sinon.restore();
  // seed fake data
  const seedData = {
    ...fakeData,
  };
  if (!seedData.tips) seedData.tips = [];
  if (!seedData.retips) seedData.retips = [];
  if (!seedData.claims) seedData.claims = [];
  seedData.tips = seedData.tips.map(tip => ({
    id: '1_v1',
    title: 'some',
    type: 'AE_TIP',
    contractId: 'ct_test',
    timestamp: 0,
    amount: 1,
    topics: [],
    ...tip,
  }));

  seedData.claims = seedData.claims.map(claim => ({
    claimGen: 0,
    url: 'example.com',
    amount: 1,
    contractId: 'ct_test',
    ...claim,
  }));
  sinon.stub(aeternity, 'fetchStateBasic').callsFake(async () => seedData);
  await TipLogic.updateTipsRetipsClaimsDB();
};

module.exports = {
  publicKey,
  secretKey,
  signChallenge,
  shouldBeValidChallengeResponse,
  performSignedJSONRequest,
  performSignedMultipartFormRequest,
  performSignedGETRequest,
  getDBSeedFunction,
};
