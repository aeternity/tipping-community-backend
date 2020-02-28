//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');

const { LinkPreview } = require('../utils/database.js');

chai.use(chaiHttp);
//Our parent block
describe('Language', () => {
  before(async () => { //Before each test we empty the database
    await LinkPreview.destroy({
      where: {},
      truncate: true,
    });
    await LinkPreview.create({
      requestUrl: 'en',
      lang: 'en',
      querySucceeded: true
    });
    await LinkPreview.create({
      requestUrl: 'zh',
      lang: 'zh',
      querySucceeded: true
    });
  });

  describe('Language API', () => {
    it('it should GET all the chinese entries', (done) => {
      chai.request(server).get('/language/zh').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.should.have.length(1);
        const firstResult = res.body[0];
        firstResult.should.eql('zh');
        done();
      });
    });

    it('it should GET all the english entries', (done) => {
      chai.request(server).get('/language/en').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.should.have.length(1);
        const firstResult = res.body[0];
        firstResult.should.eql('en');
        done();
      });
    });
  });

});
