require("dotenv").config();
const { expect, requester } = require("./set_up");
const { users } = require("./fake_data");
const sinon = require("sinon");
const path = require("path");
const { resolve } = require("path");
let stub;
const user1 = users[0];
const user = {
  email: user1.email,
  password: user1.password,
};
let accessToken;
let userId;

describe("create room", () => {
  before(async () => {
    const res = await requester.post("/api/users/signin").send(user);
    accessToken = res.body.access_token;
    userId = res.body.info.id;
    const doNothing = () => {};
    const Util = require("../util/util");
    stub = sinon.stub(Util, "imageUpload").callsFake(doNothing);
  });

  it("correct room name", async () => {
    const roomName = "Test Room";
    const res = await requester
      .post("/api/rooms/create")
      .set("Authorization", "Bearer " + accessToken)
      .field("room_name", roomName);
    const data = res.body;

    expect(res.status).to.equal(200);
    expect(data.id).to.be.a("number");
    expect(data.name).to.equal(roomName);
    expect(data.picture).to.contain.oneOf(["jpg", "png", "jpeg"]);
    expect(data.host_id).to.equal(userId);
  });

  it("correct room name with image", async () => {
    const roomName = "Test Room";
    const image = "test.png";
    const res = await requester
      .post("/api/rooms/create")
      .set("Authorization", "Bearer " + accessToken)
      .field("room_name", roomName)
      .attach("picture", path.join(__dirname, `/${image}`));
    const data = res.body;

    expect(res.status).to.equal(200);
    expect(data.id).to.be.a("number");
    expect(data.name).to.equal(roomName);
    expect(+data.picture.substr(-13, 13)).to.closeTo(Date.now(), 1000);
    expect(data.host_id).to.equal(userId);
  });

  it("without room name", async () => {
    const res1 = await requester
      .post("/api/rooms/create")
      .set("Authorization", "Bearer " + accessToken);
    const data1 = res1.body;

    expect(res1.status).to.equal(403);
    expect(data1.error).to.equal("Incorrect name");

    const roomName = "    ";
    const res2 = await requester
      .post("/api/rooms/create")
      .set("Authorization", "Bearer " + accessToken)
      .field("room_name", roomName);
    const data2 = res2.body;

    expect(res2.status).to.equal(403);
    expect(data2.error).to.equal("Incorrect name");
  });

  it("without access token", async () => {
    const roomName = "Test Room";
    const res = await requester.post("/api/rooms/create").field("room_name", roomName);
    const data = res.body;

    expect(res.status).to.equal(401);
    expect(data.error).to.equal("Unauthorized");
  });

  after(() => {
    stub.restore();
  });
});
