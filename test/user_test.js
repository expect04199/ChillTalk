require("dotenv").config();
const { expect, requester } = require("./set_up");

describe("sign up", () => {
  it("correct sign up", async () => {
    const user = {
      name: "Carl",
      email: "carl@test.com",
      password: "test1234",
      introduction: "No content",
      picture: "https://d28ad0xxqchuot.cloudfront.net/preset/1/picture/dogee.png",
      background: "https://d28ad0xxqchuot.cloudfront.net/preset/1/background/sunset.jpg",
    };

    const res = await requester.post("/api/users/signup").send(user);
    const info = res.body.info;

    expect(res.status).to.equal(200);
    expect(info.name).to.equal(user.name);
    expect(info.email).to.equal(user.email);
    expect(info.introduction).to.equal(user.introduction);
    expect(info.online).to.equal(1);
    expect(info.picture).to.equal(user.picture);
    expect(info.background).to.equal(user.background);
    expect(info.id).to.be.a("number");
    expect(res.body.access_token).to.be.a("string");
    expect(info.last_login).to.closeTo(Date.now(), 1000);
  });

  it("already sign up", async () => {
    const user = {
      name: "Harry",
      email: "test123@test.com",
      password: "test1234",
    };

    const res = await requester.post("/api/users/signup").send(user);

    expect(res.status).to.equal(403);
    expect(res.body.error).to.equal("Email Already Exists");
  });

  it("without name, email or password", async () => {
    const user1 = {
      name: "Jason",
      email: "test1234@test.com",
    };
    const res1 = await requester.post("/api/users/signup").send(user1);

    expect(res1.status).to.equal(400);
    expect(res1.body.error).to.equal("Name, email or password is invalid");

    const user2 = {
      name: "Jason",
      password: "test1234",
    };
    const res2 = await requester.post("/api/users/signup").send(user2);

    expect(res2.status).to.equal(400);
    expect(res2.body.error).to.equal("Name, email or password is invalid");

    const user3 = {
      email: "test12345@test.com",
      password: "test1234",
    };
    const res3 = await requester.post("/api/users/signup").send(user3);

    expect(res3.status).to.equal(400);
    expect(res3.body.error).to.equal("Name, email or password is invalid");
  });

  it("too long name, email or password", async () => {
    const user1 = {
      name: "Jason",
      email: "test1234@test.com",
      password: "ssfsafasfasfasfadssfsafasfdsdf",
    };
    const res1 = await requester.post("/api/users/signup").send(user1);

    expect(res1.status).to.equal(400);
    expect(res1.body.error).to.equal("Name, email or password is invalid");

    const user2 = {
      name: "Jason",
      email: "jskfslkfjslkafj@text.com",
      password: "test1234",
    };
    const res2 = await requester.post("/api/users/signup").send(user2);

    expect(res2.status).to.equal(400);
    expect(res2.body.error).to.equal("Name, email or password is invalid");

    const user3 = {
      name: "werqrewrewrwrewrewrqw",
      email: "test12345@test.com",
      password: "test1234",
    };
    const res3 = await requester.post("/api/users/signup").send(user3);

    expect(res3.status).to.equal(400);
    expect(res3.body.error).to.equal("Name, email or password is invalid");
  });

  it("not with correct email", async () => {
    const user1 = {
      name: "Harry",
      email: "test123test.com",
      password: "test1234",
    };
    const res1 = await requester.post("/api/users/signup").send(user1);

    expect(res1.status).to.equal(400);
    expect(res1.body.error).to.equal("Name, email or password is invalid");

    const user2 = {
      name: "Harry",
      email: "test123@test",
      password: "test1234",
    };
    const res2 = await requester.post("/api/users/signup").send(user2);

    expect(res2.status).to.equal(400);
    expect(res2.body.error).to.equal("Name, email or password is invalid");
  });
});
