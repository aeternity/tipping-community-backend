const { signPersonalMessage, generateKeyPair, hash } = require('@aeternity/aepp-sdk').Crypto;
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const fs = require('fs');

const { publicKey, secretKey } = generateKeyPair();

const signChallenge = (challenge, privateKey = null) => {
  if (!privateKey) privateKey = secretKey;
  const signatureBuffer = signPersonalMessage(
    challenge,
    Buffer.from(privateKey, 'hex'),
  );
  return Buffer.from(signatureBuffer).toString('hex');
};

const shouldBeValidChallengeResponse = (serverBody, testData) => {
  serverBody.should.be.a('object');
  serverBody.should.have.property('challenge');
  serverBody.should.have.property('payload');
  Object.keys(testData).map(key => {
    serverBody.payload.should.contain(`${key}=${testData[key]}`);
  });
};

const performSignedMultipartFormRequest = (server, method, url, field, path, privateKey = null) => {
  return new Promise((resolve, reject) => {
    chai.request(server)[method](url)
      .field('Content-Type', 'multipart/form-data')
      .attach(field, path)
      .end((err, res) => {
        res.should.have.status(200);
        shouldBeValidChallengeResponse(res.body, {
          [field]: hash(fs.readFileSync(path)).toString('hex')
        });
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge, privateKey);
        chai.request(server)[method](url).send({
          challenge: challenge,
          signature,
        }).end((err, res) => {
            if (err) return reject(err);
            return resolve({ res, signature, challenge });
          });
      });
  });
};

const performSignedJSONRequest = (server, method, url, data, privateKey = null) => {
  return new Promise((resolve, reject) => {
    chai.request(server)[method](url)
      .send(data)
      .end((err, res) => {
        res.should.have.status(200);
        shouldBeValidChallengeResponse(res.body, data);
        const challenge = res.body.challenge;
        const signature = signChallenge(challenge, privateKey);
        chai.request(server)[method](url)
          .send({ challenge, signature })
          .end((err, res) => {
            if (err) return reject(err);
            return resolve({ res, signature, challenge });
          });
      });
  });
};

module.exports = {
  publicKey,
  signChallenge,
  shouldBeValidChallengeResponse,
  performSignedJSONRequest,
  performSignedMultipartFormRequest
};
