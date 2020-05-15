//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
const { Trace: TraceModel } = require('../models');

chai.use(chaiHttp);
//Our parent block
describe('Trace', () => {
  before((done) => { //Before each test we empty the database
    TraceModel.destroy({
      where: {},
      truncate: true,
    }).then(() => done());
  });


  describe('TraceLogic API', () => {
    it('it should GET all the traces (empty)', (done) => {
      chai.request(server).get('/tracing/backend?id=0').end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(0);
        done();
      });
    });
  });
});
