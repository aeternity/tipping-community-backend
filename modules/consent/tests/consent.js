import chai from 'chai';
import chaiHttp from 'chai-http';
import mocha from 'mocha';
import server from '../../../server.js';
import { publicKey, performSignedJSONRequest, performSignedGETRequest } from '../../../utils/testingUtil.js';
import { CONSENT_STATES } from '../constants/consentStates.js';
import models from '../../../models/index.js';

const { describe, it, before } = mocha;
const { Consent } = models;
chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Consent Storage', () => {
  before(async () => {
    await Consent.destroy({
      where: {},
      truncate: true,
    });
  });
  const testData = {
    scope: 'youtube.com',
    status: CONSENT_STATES.ALLOWED,
  };
  describe('API', () => {
    it('it should GET all consented scopes (empty)', async () => {
      const { res } = await performSignedGETRequest(server, `/consent/${publicKey}`);
      res.should.have.status(200);
      res.body.should.be.a('array');
      res.body.length.should.be.eql(0);
    });
    it('it should 404 on a non existing scope', async () => {
      const { res } = await performSignedGETRequest(server, `/consent/${publicKey}/${testData.scope}`);
      res.should.have.status(404);
    });
    let entryId = null;
    it('it should CREATE a new consent entry', async () => {
      const { res } = await performSignedJSONRequest(server, 'post', `/consent/${publicKey}/${testData.scope}`, {
        status: testData.status,
      });
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('author', publicKey);
      res.body.should.have.property('scope', testData.scope);
      res.body.should.have.property('status', testData.status);
      res.body.should.have.property('signature');
      res.body.should.have.property('challenge');
      res.body.should.have.property('createdAt');
      res.body.should.have.property('updatedAt');
      entryId = res.body.id;
    });
    it('it should GET all consent scopes (1 result)', async () => {
      const { res } = await performSignedGETRequest(server, `/consent/${publicKey}`);
      res.should.have.status(200);
      res.body.should.be.a('array');
      res.body.length.should.be.eql(1);
      res.body[0].should.have.property('id', entryId);
    });
    it('it should GET a specific item', async () => {
      const { res } = await performSignedGETRequest(server, `/consent/${publicKey}/${testData.scope}`);
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('id', entryId);
    });
    it('it should OVERWRITE a specific item', async () => {
      const { res } = await performSignedJSONRequest(server, 'post', `/consent/${publicKey}/${testData.scope}`, {
        status: CONSENT_STATES.REJECTED,
      });
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('id', entryId);
      res.body.should.have.property('status', CONSENT_STATES.REJECTED);
    });
    it('it should DELETE a specific item', async () => {
      const { res } = await performSignedJSONRequest(server, 'delete', `/consent/${publicKey}/${testData.scope}`);
      res.should.have.status(204);
    });
    it('it should 404 on a deleted scope', async () => {
      const { res } = await performSignedGETRequest(server, `/consent/${publicKey}/${testData.scope}`);
      res.should.have.status(404);
    });
  });
});
