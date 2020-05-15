//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
const { Trace: TraceModel } = require('../models');
const ae = require('../utils/aeternity');
const fs = require('fs');

chai.use(chaiHttp);
//Our parent block
describe('Trace', () => {
  before(async function () { //Before each test we empty the database
    this.timeout(10000);
    await TraceModel.destroy({
      where: {},
      truncate: true,
    });
    await ae.init();
  });

  describe('TraceLogic API Backend', () => {
    it('it should GET all traces for tipID 0', function (done) {
      this.timeout(10000);
      chai.request(server).get('/tracing/backend?id=0').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });

    it('malformed request without url should not leave a trace', (done) => {
      chai.request(server).post('/claim/submit')
        .send({
          address: 'ak_25tyimcbt8W5BHauzazQKnb6oM1AbkPBYFu6fnSvp38kVrtr8t', // RANDOM PK
        })
        .end((err, res) => {
          res.should.have.status(400);
          TraceModel.findAll({raw: true}).then(results => {
            results.should.have.length(0);
            done();
          });

        });
    });

    it('malformed request with claimamount 0 should not leave a trace', (done) => {
      chai.request(server).post('/claim/submit')
        .send({
          address: 'ak_25tyimcbt8W5BHauzazQKnb6oM1AbkPBYFu6fnSvp38kVrtr8t', // Random PK
          url: 'https://this.is.a.fake.url', // Random URL
        })
        .end((err, res) => {
          res.should.have.status(500);
          TraceModel.findAll({raw: true}).then(results => {
            results.should.have.length(0);
            done();
          });
        });
    });

    it('proper request should leave a trace', (done) => {
      chai.request(server).post('/claim/submit')
        .send({
          address: 'ak_25tyimcbt8W5BHauzazQKnb6oM1AbkPBYFu6fnSvp38kVrtr8t', // Random PK
          url: 'https://pastebin.com/raw/PCmAx7M8', // URL with tokens and .chain name
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('claimUUID');
          fs.existsSync(`./traces/${res.body.claimUUID}.json`).should.be.true;
          done();
        });
    });
  });
});
