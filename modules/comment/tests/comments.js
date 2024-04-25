import chaiHttp from "chai-http";
import server from "../../../server.js";
import models from "../../../models/index.js";
import { ENTITY_TYPES, NOTIFICATION_TYPES } from "../../notification/constants/notification.js";
import { publicKey, performSignedJSONRequest, shouldBeValidChallengeResponse, getDBSeedFunction } from "../../../utils/testingUtil.js";
import aeternity from "../../aeternity/logic/aeternity.js";
import MdwLogic from "../../aeternity/logic/mdwLogic.js";

const { describe, it, before } = mocha;
const { Comment, sequelize, Notification, Retip } = models;
chai.should();
chai.use(chaiHttp);
// Our parent block
describe("Comments", () => {
  const testData = {
    tipId: "0_v1",
    text: "What an awesome website",
    author: publicKey,
  };
  const testDataWithTokens = {
    tipId: "1_v2",
    text: "What an awesome website",
    author: publicKey,
  };
  let commentId = null;
  before(async () => {
    this.timeout(10000);
    await sequelize.models.Commentancestor.destroy({
      where: {},
      truncate: true,
    });
    await Promise.all((await Comment.findAll()).map((object) => Comment.update({ parentId: null }, { where: { id: object.id } })));
    const seedDB = getDBSeedFunction([Comment, Notification, Retip]);
    await seedDB({
      tips: [
        {
          id: testData.tipId,
          sender: testData.author,
          title: "some",
          type: "AE_TIP",
          contractId: "ct_test",
          timestamp: 0,
          topics: [],
        },
        {
          sender: "ak_sender3",
          title: "#test",
          type: "TOKEN_TIP",
          token: "ct_2bCbmU7vtsysL4JiUdUZjJJ98LLbJWG1fRtVApBvqSFEM59D6W",
          token_amount: "1000000000000000000",
          claimGen: 1,
          amount: 0,
          id: testDataWithTokens.tipId,
          contractId: aeternity.contractAddressForVersion("v2"),
          url: "https://github.com/stanislav-slavov",
          tokenAmount: "1000000000000000000",
          topics: ["#test"],
        },
      ],
    });
    await aeternity.init();
  });
  describe("Comment API", () => {
    it("it should return a signature challenge", (done) => {
      chai
        .request(server)
        .post("/comment/api")
        .send(testData)
        .end((err, res) => {
          shouldBeValidChallengeResponse(res.body, testData);
          done();
        });
    });
    it("it should CREATE a new comment entry", (done) => {
      performSignedJSONRequest(server, "post", "/comment/api", testData).then(({ res, challenge, signature }) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("id");
        res.body.should.have.property("tipId", testData.tipId);
        res.body.should.have.property("text", testData.text);
        res.body.should.have.property("author", testData.author);
        res.body.should.have.property("challenge", challenge);
        res.body.should.have.property("signature", signature);
        res.body.should.have.property("hidden", false);
        res.body.should.have.property("createdAt");
        res.body.should.have.property("updatedAt");
        commentId = res.body.id;
        // SHOULD ALSO CREATE NOTIFICATIONS
        Notification.findOne({
          where: {
            type: NOTIFICATION_TYPES.COMMENT_ON_TIP,
            entityType: ENTITY_TYPES.COMMENT,
            entityId: String(commentId),
            receiver: testData.author,
          },
          raw: true,
        }).then((notification) => {
          notification.should.be.a("object");
          done();
        });
      });
    });
    it("it should REJECT a new comment entry for a tip with tokens when user has no tokens", (done) => {
      performSignedJSONRequest(server, "post", "/comment/api", testDataWithTokens).then(({ res }) => {
        res.should.have.status(400);
        res.body.should.be.a("object");
        res.body.should.have.property("error", "The commenting user needs to own at least one token the tip has been tipped or retipped with.");
        done();
      });
    });
    it("it should CREATE a new comment entry for a tip with tokens when user has tokens", (done) => {
      jest.spyOn(MdwLogic, "fetchTokenBalancesForAddress").mockClear().mockImplementation(async () => [{ amount: "100000000000000", contract_id: "ct_2bCbmU7vtsysL4JiUdUZjJJ98LLbJWG1fRtVApBvqSFEM59D6W" }]);
      performSignedJSONRequest(server, "post", "/comment/api", testDataWithTokens).then(({ res, challenge, signature }) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("id");
        res.body.should.have.property("tipId", testDataWithTokens.tipId);
        res.body.should.have.property("text", testData.text);
        res.body.should.have.property("author", testData.author);
        res.body.should.have.property("challenge", challenge);
        res.body.should.have.property("signature", signature);
        res.body.should.have.property("hidden", false);
        res.body.should.have.property("createdAt");
        res.body.should.have.property("updatedAt");
        done();
      });
    });
    it("it should CREATE a profile with a new comment", (done) => {
      chai
        .request(server)
        .get(`/profile/${testData.author}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("author", testData.author);
          res.body.should.have.property("challenge", "automated-profile");
          res.body.should.have.property("signature", "automated-profile");
          res.body.should.have.property("createdAt");
          res.body.should.have.property("updatedAt");
          done();
        });
    });
    it("it should GET a single item", (done) => {
      chai
        .request(server)
        .get(`/comment/api/${commentId}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("id", commentId);
          res.body.should.have.property("tipId", testData.tipId);
          res.body.should.have.property("text", testData.text);
          res.body.should.have.property("author", testData.author);
          res.body.should.have.property("challenge");
          res.body.should.have.property("signature");
          res.body.should.have.property("hidden", false);
          res.body.should.have.property("createdAt");
          res.body.should.have.property("updatedAt");
          res.body.should.have.property("Profile");
          const profile = res.body.Profile;
          profile.should.have.property("author", testData.author);
          done();
        });
    });
    it("it should GET all items from a thread", (done) => {
      chai
        .request(server)
        .get(`/comment/api/tip/${encodeURIComponent(testData.tipId)}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          res.body.length.should.be.eql(1);
          res.body[0].should.have.property("id", commentId);
          res.body[0].should.have.property("Profile");
          const profile = res.body[0].Profile;
          profile.should.have.property("author", testData.author);
          done();
        });
    });
    it("it should GET all items for an address", (done) => {
      chai
        .request(server)
        .get(`/comment/api/author/${testData.author}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          res.body.length.should.be.eql(2);
          res.body[0].should.have.property("id", commentId);
          res.body[0].should.have.property("Profile");
          const profile = res.body[0].Profile;
          profile.should.have.property("author", testData.author);
          done();
        });
    });
    it("it should DELETE a single comment entry", (done) => {
      performSignedJSONRequest(server, "delete", `/comment/api/${commentId}`, { author: testData.author }).then(({ res }) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        done();
      });
    });
    it("it should 404 on getting a deleted item", (done) => {
      chai
        .request(server)
        .get(`/comment/api/${commentId}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
  });
  describe("Recursive Comments", () => {
    let parentComment;
    before(async () => {
      await Comment.destroy({
        where: {},
        truncate: true,
        cascade: true,
      });
      parentComment = await Comment.create(
        {
          tipId: testData.tipId,
          text: "Parent Comment",
          author: "ak_testing",
          signature: "sig",
          challenge: "chall",
        },
        { raw: true },
      );
      const childComment = await Comment.create(
        {
          tipId: testData.tipId,
          text: "Child Comment",
          author: "ak_testing",
          signature: "sig",
          challenge: "chall",
          parentId: parentComment.id,
        },
        { raw: true },
      );
      await Comment.create(
        {
          tipId: testData.tipId,
          text: "Child Comment",
          author: "ak_testing",
          signature: "sig",
          challenge: "chall",
          parentId: childComment.id,
        },
        { raw: true },
      );
    });
    it("it should CREATE a nested comment entry", (done) => {
      const nestedTestData = { ...testData, parentId: parentComment.id };
      performSignedJSONRequest(server, "post", "/comment/api", nestedTestData).then(({ res, signature, challenge }) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("id");
        res.body.should.have.property("tipId", nestedTestData.tipId);
        res.body.should.have.property("text", nestedTestData.text);
        res.body.should.have.property("author", nestedTestData.author);
        res.body.should.have.property("parentId", nestedTestData.parentId);
        res.body.should.have.property("challenge", challenge);
        res.body.should.have.property("signature", signature);
        res.body.should.have.property("hidden", false);
        res.body.should.have.property("createdAt");
        res.body.should.have.property("updatedAt");
        commentId = res.body.id;
        // SHOULD ALSO CREATE NOTIFICATIONS
        Notification.findOne({
          where: {
            type: NOTIFICATION_TYPES.COMMENT_ON_TIP,
            entityType: ENTITY_TYPES.COMMENT,
            entityId: String(commentId),
            receiver: testData.author,
          },
          raw: true,
        }).then((notification) => {
          notification.should.be.a("object");
          // SHOULD ALSO CREATE NOTIFICATIONS
          Notification.findOne({
            where: {
              type: NOTIFICATION_TYPES.COMMENT_ON_COMMENT,
              entityType: ENTITY_TYPES.COMMENT,
              entityId: String(commentId),
              receiver: "ak_testing",
            },
            raw: true,
          }).then((secondNotification) => {
            secondNotification.should.be.a("object");
            done();
          });
        });
      });
    });
    it("it should REJECT a nested comment entry with a wrong parent id", (done) => {
      const nestedTestData = { ...testData, parentId: 0 };
      performSignedJSONRequest(server, "post", "/comment/api", nestedTestData).then(({ res }) => {
        res.should.have.status(400);
        res.body.should.have.property("error", `Could not find parent comment with id ${nestedTestData.parentId}`);
        done();
      });
    });
    it("it should GET children with parent", (done) => {
      chai
        .request(server)
        .get(`/comment/api/${parentComment.id}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("id", parentComment.id);
          res.body.should.have.property("children");
          res.body.children.should.be.an("array");
          res.body.children.should.have.length(2);
          const child1 = res.body.children[0];
          child1.should.have.property("id", parentComment.id + 1);
          child1.should.have.property("children");
          const childNested = child1.children[0];
          childNested.should.have.property("id", parentComment.id + 2);
          const child2 = res.body.children[1];
          child2.should.have.property("id", parentComment.id + 3);
          done();
        });
    });
    it("it should GET ALL comments with children for a tipId", (done) => {
      chai
        .request(server)
        .get(`/comment/api/tip/${testData.tipId}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          res.body.should.have.length(4);
          const firstElement = res.body[0];
          firstElement.should.have.property("id", parentComment.id);
          firstElement.should.have.property("children");
          firstElement.children.should.be.an("array");
          firstElement.children.should.have.length(2);
          const child1 = firstElement.children[0];
          child1.should.have.property("id", parentComment.id + 1);
          child1.should.have.property("children");
          const childNested = child1.children[0];
          childNested.should.have.property("id", parentComment.id + 2);
          const child2 = firstElement.children[1];
          child2.should.have.property("id", parentComment.id + 3);
          done();
        });
    });
  });
});
