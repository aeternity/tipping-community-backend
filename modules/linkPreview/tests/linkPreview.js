// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const { describe, it, before } = require('mocha');
const server = require('../../../server');
const { LinkPreview } = require('../../../models');
const LinkPreviewLogic = require('../logic/linkPreviewLogic');

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
    await LinkPreviewLogic.generatePreview(requestUrl);
  });

  describe('LinkPreview API', () => {
    it('it should GET all the linkpreview entries (empty)', done => {
      chai.request(server).get('/linkpreview/').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
    });

    let imageUrl;

    it('it get link preview for aeternity.com', done => {
      chai.request(server).get(`/linkpreview?url=${encodeURIComponent(requestUrl)}`).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.should.have.property('requestUrl', requestUrl);
        res.body.should.have.property('title');
        res.body.should.have.property('description');
        res.body.should.have.property('lang');
        res.body.should.have.property('image');
        res.body.should.have.property('querySucceeded', true);
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        imageUrl = res.body.image;
        done();
      });
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
