// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, before } = require('mocha');
const server = require('../server');
const { publicKey, performSignedJSONRequest } = require('../utils/testingUtil');
const { CONSENT_STATES } = require('../models/enums/consent');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Consent Storage', () => {
  before(async () => { // Before each test we empty the database
    // TODO Clear DB
  });

  const testData = {
    scope: 'youtube.com',
    status: CONSENT_STATES.ALLOWED,
  };

  describe('API', () => {
    it('it should GET all consented domains (empty)', async () => {
      const res = await chai.request(server).get(`/consent/${publicKey}`);
      res.should.have.status(200);
      res.body.should.be.a('array');
      res.body.length.should.be.eql(0);
    });

    it('it should 404 on a non existing scope', async () => {
      const res = await chai.request(server).get(`/consent/${publicKey}/${testData.scope}`);
      res.should.have.status(404);
    });

    let entryId = null;
    it('it should CREATE a new error report', async () => {
      const res = await performSignedJSONRequest(server, 'POST', `/consent/${publicKey}/${testData.scope}`, {
        status: testData.status,
      });
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('author', publicKey);
      res.body.should.have.property('scope', testData.scope);
      res.body.should.have.property('status', testData.status);
      res.body.should.have.property('createdAt');
      res.body.should.have.property('updatedAt');
      entryId = res.body.id;
    });

    it('it should GET all reports (1 result)', async () => {
      const res = await chai.request(server).get(`/consent/${publicKey}`);
      res.should.have.status(200);
      res.body.should.be.a('array');
      res.body.length.should.be.eql(1);
      res.body[0].should.have.property('id', entryId);
    });

    it('it should GET a specific item', async () => {
      const res = await chai.request(server).get(`/consent/${publicKey}/${testData.scope}`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('id', entryId);
    });

    it('it should OVERWRITE a specific item', async () => {
      const res = await performSignedJSONRequest(server, 'POST', `/consent/${publicKey}/${testData.scope}`, {
        status: CONSENT_STATES.REJECTED,
      });
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('id', entryId);
      res.body.should.have.property('status', CONSENT_STATES.REJECTED);
    });

    it('it should DELETE a specific item', async () => {
      const res = await performSignedJSONRequest(server, 'DELETE', `/consent/${publicKey}/${testData.scope}`);
      res.should.have.status(200);
      res.body.should.be.a('object');
    });

    it('it should 404 on a deleted scope', async () => {
      const res = await chai.request(server).get(`/consent/${publicKey}/${testData.scope}`);
      res.should.have.status(404);
    });
  });
});
