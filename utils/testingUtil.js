const { signPersonalMessage, generateKeyPair, hash } = require('@aeternity/aepp-sdk').Crypto;
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const fs = require('fs');

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

const performSignedJSONRequest = (server, method, url, data, privateKey = null) => new Promise((resolve, reject) => {
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

module.exports = {
  publicKey,
  signChallenge,
  shouldBeValidChallengeResponse,
  performSignedJSONRequest,
  performSignedMultipartFormRequest,
  performSignedGETRequest,
};
