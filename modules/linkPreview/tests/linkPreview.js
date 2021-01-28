// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const { describe, it, before } = require('mocha');
const sinon = require('sinon');
const server = require('../../../server');
const { LinkPreview } = require('../../../models');
const linkPreviewLogic = require('../logic/linkPreviewLogic');
const { MESSAGES, MESSAGE_QUEUES } = require('../../queue/constants/queue');
const queueLogic = require('../../queue/logic/queueLogic');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('LinkPreview', () => {
  const requestUrl = 'https://aeternity.com/';

  before(async function () {
    this.timeout(25000);
    await LinkPreview.destroy({
      where: {},
      truncate: true,
    });
  });

  describe('LinkPreview API', () => {
    let imageUrl;

    it('it get link preview for aeternity.com', async () => {
      const dbResult = await linkPreviewLogic.generatePreview(requestUrl);
      const preview = dbResult.toJSON();
      preview.should.have.property('id');
      preview.should.have.property('description', 'æternity is a public open source smart contract platform.');
      preview.should.have.property('image');
      preview.image.should.contain('/images/preview');
      preview.should.have.property('lang', 'en');
      preview.should.have.property('title', 'æternity - a blockchain for scalable, secure and decentralized æpps');
      preview.should.have.property('url', 'https://aeternity.com');
      preview.should.have.property('requestUrl', requestUrl);
      preview.should.have.property('responseUrl', 'https://aeternity.com');
      preview.should.have.property('querySucceeded', true);
      preview.should.have.property('updatedAt');
      preview.should.have.property('createdAt');
      preview.should.have.property('failReason', null);
      imageUrl = preview.image;
    });

    it('it should call the update function when receiving a mq item', done => {
      const updateMock = sinon.stub(linkPreviewLogic, 'updateLinkpreviewDatabase').callsFake(async () => {});
      queueLogic.sendMessage(MESSAGE_QUEUES.LINKPREVIEW, MESSAGES.LINKPREVIEW.COMMANDS.UPDATE_DB);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        updateMock.restore();
        done();
      }, 500);
    });

    it('it get an image for aeternity.com', done => {
      chai.request(server).get(imageUrl).end((err, res) => {
        res.should.have.status(200);
        res.should.have.header('content-type');
        res.should.have.header('content-length');
        done();
      });
    });

    it('it get an image for aeternity.com from the legacy API', done => {
      chai.request(server).get(imageUrl.replace('/images/', '/linkpreview/image/')).end((err, res) => {
        res.should.have.status(200);
        res.should.have.header('content-type');
        res.should.have.header('content-length');
        done();
      });
    });

    it('it should fail on none cached urls', done => {
      chai.request(server).get(`/linkpreview?url=${encodeURIComponent('https://domain.test')}`).end((err, res) => {
        res.should.have.status(404);
        done();
      });
    });

    after(() => {
      fs.readdirSync('images')
        .filter(fileName => fileName.includes('preview-'))
        .map(file => fs.unlinkSync(`images/${file}`));
    });
  });
});
