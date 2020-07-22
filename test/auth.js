// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');
const server = require('../server');

const {
  shouldBeValidChallengeResponse,
  signChallenge,
  publicKey,
  performSignedJSONRequest,
  performSignedGETRequest,
} = require('../utils/testingUtil');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Authenticator', () => {
  const testData = {
    biography: 'What an awesome bio',
    preferredChainName: 'awesomename.chain',
    referrer: 'ak_aNTSYaqHmuSfKgBPjBm95eJz82JXKznCZVdchKKKh7jtDAJcW',
    author: publicKey,
    location: 'awesome, location, country',
  };

  describe('Notification Authentication', () => {
    it('it should return a signature challenge', done => {
      chai.request(server).get(`/notification/user/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        shouldBeValidChallengeResponse(res.body, { author: publicKey });
        done();
      });
    });

    it('it should fail with invalid signature', done => {
      chai.request(server).get(`/notification/user/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        shouldBeValidChallengeResponse(res.body, { author: publicKey });

        const { challenge } = res.body;
        chai.request(server).get(`/notification/user/${publicKey}`).query({ challenge, signature: 'wrong' })
          .end((innerError, innerRes) => {
            innerRes.should.have.status(401);
            innerRes.body.should.be.a('object');
            innerRes.body.should.have.property('err', 'bad signature size');
            done();
          });
      });
    });

    it('it should fail on invalid challenge', done => {
      chai.request(server).get(`/notification/user/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        shouldBeValidChallengeResponse(res.body, { author: publicKey });
        const { challenge } = res.body;
        const signature = signChallenge(challenge);
        chai.request(server).get(`/notification/user/${publicKey}`).query({
          challenge: challenge.substring(2),
          signature,
        }).end((innerError, innerRes) => {
          innerRes.should.have.status(401);
          innerRes.body.should.be.a('object');
          innerRes.body.should.have.property('err', 'Could not find challenge (maybe it already expired?)');
          done();
        });
      });
    });

    it('it should fail at a change of paths', done => {
      chai.request(server).get(`/notification/user/${publicKey}`).end((err, res) => {
        res.should.have.status(200);
        shouldBeValidChallengeResponse(res.body, { author: publicKey });
        const { challenge } = res.body;
        const signature = signChallenge(challenge);
        chai.request(server).get(`/notification/user/${publicKey}a`).query({
          challenge,
          signature,
        }).end((innerError, innerRes) => {
          innerRes.should.have.status(401);
          innerRes.body.should.be.a('object');
          innerRes.body.should.have.property('err', 'Challenge was issued for a different path');
          done();
        });
      });
    });

    it('it should reject getting information for someone elses public key', done => {
      performSignedGETRequest(server, '/notification/user/ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk').then(({ res }) => {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('err', 'Invalid signature');
        done();
      });
    });
  });

  describe('Profile Authentication', () => {
    it('it should return a signature challenge', done => {
      chai.request(server).post(`/profile/${publicKey}`).send(testData).end((err, res) => {
        res.should.have.status(200);
        shouldBeValidChallengeResponse(res.body, testData);
        done();
      });
    });

    it('it should fail with invalid signature', done => {
      chai.request(server).post(`/profile/${publicKey}`).send(testData).end((err, res) => {
        res.should.have.status(200);
        shouldBeValidChallengeResponse(res.body, testData);

        const { challenge } = res.body;
        chai.request(server).post(`/profile/${publicKey}`).send({ challenge, signature: 'wrong' })
          .end((innerError, innerRes) => {
            innerRes.should.have.status(401);
            innerRes.body.should.be.a('object');
            innerRes.body.should.have.property('err', 'bad signature size');
            done();
          });
      });
    });

    it('it should fail on invalid challenge', done => {
      chai.request(server).post(`/profile/${publicKey}`).send(testData).end((err, res) => {
        res.should.have.status(200);
        shouldBeValidChallengeResponse(res.body, testData);
        const { challenge } = res.body;
        const signature = signChallenge(challenge);
        chai.request(server).post(`/profile/${publicKey}`).send({
          challenge: challenge.substring(2),
          signature,
        }).end((innerError, innerRes) => {
          innerRes.should.have.status(401);
          innerRes.body.should.be.a('object');
          innerRes.body.should.have.property('err', 'Could not find challenge (maybe it already expired?)');
          done();
        });
      });
    });

    it('it should fail at a change of paths', done => {
      chai.request(server).post(`/profile/${publicKey}`).send(testData).end((err, res) => {
        res.should.have.status(200);
        shouldBeValidChallengeResponse(res.body, testData);
        const { challenge } = res.body;
        const signature = signChallenge(challenge);
        chai.request(server).post('/profile/').send({
          challenge,
          signature,
        }).end((innerError, innerRes) => {
          innerRes.should.have.status(401);
          innerRes.body.should.be.a('object');
          innerRes.body.should.have.property('err', 'Challenge was issued for a different path');
          done();
        });
      });
    });

    it('it should reject creation for someone elses public key', done => {
      performSignedJSONRequest(server, 'post', '/profile/ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk', {
        biography: 'new bio',
      }).then(({ res }) => {
        res.should.have.status(401);
        res.body.should.be.a('object');
        res.body.should.have.property('err', 'Invalid signature');
        done();
      });
    });
  });
});
