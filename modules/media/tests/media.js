// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it, before } = require('mocha');
const fs = require('fs');
const imageLogic = require('../logic/imageLogic');

chai.should();
chai.use(chaiHttp);
// Our parent block
describe('Media', () => {
  before(done => { // Before all tests we empty the folder
    fs.readdirSync('images')
      .map(file => fs.unlinkSync(`images/${file}`));
    done();
  });
  describe('Images', () => {
    const testimage = Buffer.from('Hello');

    it('checkIfImageExists: it should return false if the image does not exists', async () => {
      const result = imageLogic.checkIfImageExists('test.png');
      result.should.be.eql(false);
    });

    it('writeImage: it should write an image', async () => {
      const writeResult = imageLogic.writeImage('test.png', testimage);
      writeResult.should.be.eql(true);
      fs.existsSync('images/test.png');
      const readResult = fs.readFileSync('images/test.png');
      readResult.should.be.eql(testimage);
    });

    it('readImage: error if file does not exist', done => {
      try {
        imageLogic.readImage('test1.png');
      } catch (e) {
        e.message.should.contain('ENOENT: no such file or directory');
        done();
      }
    });

    it('readImage: should return file buffer', async () => {
      const readResult = imageLogic.readImage('test.png');
      readResult.should.be.eql(testimage);
    });

    it('writeImage: should overwrite existing files', async () => {
      const newFile = Buffer.from('Hello2');
      const writeResult = imageLogic.writeImage('test.png', newFile);
      writeResult.should.be.eql(true);
      fs.existsSync('images/test.png');
      const readResult = fs.readFileSync('images/test.png');
      readResult.should.be.eql(newFile);
    });

    it('checkIfImageExists: should return true if file exists', async () => {
      const checkResult = imageLogic.checkIfImageExists('test.png');
      checkResult.should.be.eql(true);
    });

    it('checkIfImageExists: should return true if file exists', async () => {
      const checkResult = imageLogic.checkIfImageExists('test.png');
      checkResult.should.be.eql(true);
    });

    it('getImagePath: should work with non-existing routes', async () => {
      const pathResult = imageLogic.getImagePath('test1.png');
      pathResult.should.include('images/test1.png');
    });

    it('getImagePath: should work with existing routes', async () => {
      const pathResult = imageLogic.getImagePath('test.png');
      pathResult.should.include('images/test.png');
    });

    it('deleteImage: error if file does not exist', done => {
      try {
        imageLogic.deleteImage('test1.png');
      } catch (e) {
        e.message.should.contain('ENOENT: no such file or directory');
        done();
      }
    });

    it('deleteImage: should work when file exists', async () => {
      const deleteResult = imageLogic.deleteImage('test.png');
      deleteResult.should.eql(true);
    });
  });
});
