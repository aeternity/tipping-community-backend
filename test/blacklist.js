//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

const { BlacklistEntry } = require('../utils/database.js');

chai.use(chaiHttp);
//Our parent block
describe('Blacklist', () => {
  before((done) => { //Before each test we empty the database
    BlacklistEntry.destroy({
      where: {},
      truncate: true,
    }).then(() => done());
  });

  const tipId = 'https://aeternity.com,1';

  describe('Blacklist API', () => {
    it('it should GET all the blacklist entries (empty)', (done) => {
      chai.request(server).get('/blacklist/api').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });

    it('it should CREATE a new blacklist entry', (done) => {
      chai.request(server).post('/blacklist/api').auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD).send({
        id: tipId,
      }).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.should.have.property('tipId').eql(tipId);
        res.body.should.have.property('createdAt');
        res.body.should.have.property('updatedAt');
        done();
      });
    });
    it('it should GET a single item', (done) => {
      chai.request(server).get('/blacklist/api/' + encodeURIComponent(tipId)).end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('tipId', tipId);
        done();
      });
    });

    it('it should DELETE a single blacklist entry', (done) => {
      chai.request(server).delete('/blacklist/api/' + encodeURIComponent(tipId))
      .auth(process.env.AUTHENTICATION_USER, process.env.AUTHENTICATION_PASSWORD)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
    });
    it('it should 404 on getting a deleted item', (done) => {
      chai.request(server).get('/blacklist/api/' + encodeURIComponent(tipId)).end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.a('object');
        done();
      });
    });
  });

});
