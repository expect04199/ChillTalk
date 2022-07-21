const io = require("socket.io-client");
require("dotenv").config();
const { expect } = require("./set_up");
const { SERVER_PORT } = process.env;

const socketURL = `http://localhost:${SERVER_PORT}/channel`;
const options = {
  transports: ["websocket"],
  "force new connection": true,
};
const channel = "1";

describe("message socket", function () {
  let client1, client2;
  beforeEach(() => {
    client1 = io.connect(socketURL, options);
    client2 = io.connect(socketURL, options);
    client1.emit("connect-room", channel);
    client2.emit("connect-room", channel);
  });

  afterEach(() => {
    client1.close();
    client2.close();
  });

  it("send correct message", (done) => {
    const client1SendMessage = {
      userId: 1,
      type: "text",
      channelId: channel,
      description: "333",
      time: Date.now(),
      name: "Harry",
      picture: "https://d28ad0xxqchuot.cloudfront.net/preset/1/picture/dogee.png",
    };
    client2.on("message", (message) => {
      expect(message.id).to.be.a("number");
      delete message.id;
      expect(message).to.deep.equal(client1SendMessage);
      done();
    });
    client1.emit("message", client1SendMessage);
  });

  it("send correct message with reply", (done) => {
    const client1SendMessage = {
      userId: 1,
      type: "text",
      channelId: channel,
      description: "sfaf",
      time: Date.now(),
      name: "Harry",
      picture: "https://d28ad0xxqchuot.cloudfront.net/preset/1/picture/dogee.png",
      reply: {
        id: "2",
        name: "Harry",
        description: "afda",
        picture: "https://d28ad0xxqchuot.cloudfront.net/preset/1/picture/dogee.png",
      },
    };
    client2.on("message", (message) => {
      expect(message.id).to.be.a("number");
      delete message.id;
      expect(message).to.deep.equal(client1SendMessage);
      done();
    });
    client1.emit("message", client1SendMessage);
  });
});
