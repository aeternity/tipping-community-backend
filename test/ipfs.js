const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

const ipfs = require('../utils/ipfs.js');

chai.use(chaiHttp);
//Our parent block
describe('IPFS', () => {
  describe('IPFS Util', () => {

    let path = null;
    let randomBuffer;

    before((done) => {
      require('crypto').randomBytes(1000000, function(err, buffer) {
        randomBuffer = buffer;
        done();
      });
    });

    it('it should have a node property', (done) => {
      ipfs.node.should.not.be.undefined;
      done();
    });

    it('it should allow file upload', async function () {
      this.timeout(100000);
      const results = await ipfs.addFile(randomBuffer);

      results.should.be.an('array');
      results.should.have.length(1);

      const firstResult = results[0];

      firstResult.should.be.an('object');

      firstResult.should.have.property('path');
      path = firstResult.path;

      const size = randomBuffer.length;
      // 256 byte difference is expected for some reason
      firstResult.should.have.property('size', size + 256);
    });

    it('it should allow file pinning', async () => {
      await ipfs.pinFile(path);
      const pinned = await ipfs.getPinnedFiles();
      const foundResult = pinned.find(pinnedFile => pinnedFile.cid.toString() === path);
      foundResult.should.not.be.undefined;
    });

    it('it should check if a file exists', async () => {
      const result = await ipfs.checkFileExists(path);
      result.should.be.true;
      const negativeResult = await ipfs.checkFileExists('QmeQe5FTgMs8PNspzTQ3LRz1iMhdq9K34TQnsCP2jqt8wV');
      negativeResult.should.be.false;
    });

    it('it should get a file', async () => {
      const result = await ipfs.getFile(path);
      result.should.have.length(randomBuffer.length);
    });
  });
});
