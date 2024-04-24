import chai from "chai";
import chaiHttp from "chai-http";
import fs from "fs";
import mocha from "mocha";
import sinon from "sinon";
import server from "../../../server.js";
import models from "../../../models/index.js";
import linkPreviewLogic from "../logic/linkPreviewLogic.js";
import { MESSAGES, MESSAGE_QUEUES } from "../../queue/constants/queue.js";
import queueLogic from "../../queue/logic/queueLogic.js";
import ImageLogic from "../../media/logic/imageLogic.js";

const { describe, it, before } = mocha;
const { LinkPreview } = models;
chai.should();
chai.use(chaiHttp);
// Our parent block
describe("LinkPreview", () => {
  const requestUrl = "https://aeternity.com/";
  const superHeroUrl = "https://superhero.com/tip/0_v1";
  before(async function () {
    this.timeout(25000);
    await LinkPreview.destroy({
      where: {},
      truncate: true,
    });
    ImageLogic.init();
  });
  describe("LinkPreview API", () => {
    let imageUrl;
    it("it get link preview for aeternity.com", async function () {
      this.timeout(10000);
      const dbResult = await linkPreviewLogic.generatePreview(requestUrl);
      const preview = dbResult.toJSON();
      preview.should.have.property("id");
      preview.should.have.property("description", "Engineered to scale and last, æternity is an easily accessible blockchain platform for the global public.");
      preview.should.have.property("image");
      preview.image.should.contain("/images/compressed-preview");
      preview.should.have.property("lang", "en");
      preview.should.have.property("title", "æternity - Blockchain for scalable, secure, and decentralized æpps");
      preview.should.have.property("url", "https://aeternity.com/");
      preview.should.have.property("requestUrl", requestUrl);
      preview.should.have.property("responseUrl", "https://aeternity.com/");
      preview.should.have.property("querySucceeded", true);
      preview.should.have.property("updatedAt");
      preview.should.have.property("createdAt");
      preview.should.have.property("failReason", null);
      imageUrl = preview.image;
    });
    it("it get link preview for superhero.com", async function () {
      this.timeout(25000);
      const dbResult = await linkPreviewLogic.generatePreview(superHeroUrl);
      const preview = dbResult.toJSON();
      preview.should.have.property("id");
      preview.should.have.property("image");
      preview.image.should.contain("/images/compressed-preview");
      preview.should.have.property("lang", "en");
      preview.should.have.property("title", "Superhero Tip 0");
      preview.should.have.property("url", superHeroUrl);
      preview.should.have.property("requestUrl", superHeroUrl);
      preview.should.have.property("responseUrl", superHeroUrl);
      preview.should.have.property("querySucceeded", true);
      preview.should.have.property("updatedAt");
      preview.should.have.property("createdAt");
      preview.should.have.property("failReason", null);
      imageUrl = preview.image;
    });
    it("it should call the update function when receiving a mq item", (done) => {
      linkPreviewLogic.init();
      const updateMock = sinon.stub(linkPreviewLogic, "updateLinkpreviewDatabase").callsFake(async () => {});
      queueLogic.sendMessage(MESSAGE_QUEUES.LINKPREVIEW, MESSAGES.LINKPREVIEW.COMMANDS.UPDATE_DB);
      setTimeout(() => {
        updateMock.callCount.should.eql(1);
        updateMock.restore();
        done();
      }, 100);
    });
    it("it get an image for aeternity.com", (done) => {
      chai
        .request(server)
        .get(imageUrl)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.have.header("content-type");
          res.should.have.header("content-length");
          done();
        });
    });
    it("it get an image for aeternity.com from the legacy API", (done) => {
      chai
        .request(server)
        .get(imageUrl.replace("/images/", "/linkpreview/image/"))
        .end((err, res) => {
          res.should.have.status(200);
          res.should.have.header("content-type");
          res.should.have.header("content-length");
          done();
        });
    });
    it("it should fail on none cached urls", (done) => {
      chai
        .request(server)
        .get(`/linkpreview?url=${encodeURIComponent("https://domain.test")}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
    it("it should fail gracefully", async function () {
      this.timeout(10000);
      const dbResult = await linkPreviewLogic.generatePreview("http://httpstat.us/400");
      dbResult.should.have.property("requestUrl", "http://httpstat.us/400");
      dbResult.should.have.property("querySucceeded", false);
      dbResult.should.have.property("title", null);
      dbResult.should.have.property("description", null);
      dbResult.should.have.property("image", null);
      dbResult.should.have.property("responseUrl", null);
      dbResult.should.have.property("lang", null);
    });
    after(() => {
      fs.readdirSync("images")
        .filter((fileName) => fileName.includes("preview-"))
        .map((file) => fs.unlinkSync(`images/${file}`));
    });
  });
});
