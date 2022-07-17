require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

const { REDIS_NAME } = process.env;

// Initialize socket server
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// // connect to redis adapter
// const pubClient = createClient({ host: REDIS_NAME, port: 6379 });
// const subClient = pubClient.duplicate();

// io.adapter(createAdapter(pubClient, subClient));

// models
const Message = require("./server/models/message");
const User = require("./server/models/user");
const Stream = require("./server/models/stream");

app.set("trust proxy", true);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(cors());

const { SERVER_PORT } = process.env;

app.use("/api", [
  require("./server/routes/room"),
  require("./server/routes/channel"),
  require("./server/routes/user"),
  require("./server/routes/message"),
  require("./server/routes/friend"),
  require("./server/routes/test"),
]);

app.use("*", (req, res) => {
  return res.status(404).send("Not Found");
});

app.use((err, req, res, next) => {
  console.log(err);
  return res.status(500).json({ error: "Internal server error" });
});

// (async function () {
//   await Promise.all([pubClient.connect(), subClient.connect()]);
//   io.adapter(createAdapter(pubClient, subClient));
//   server.listen(SERVER_PORT, () => {
//     console.log("Server Connected.");
//   });
// })();

server.listen(SERVER_PORT, () => {
  console.log("Server Connected.");
});

//socket section
const channelIO = io.of("/channel");
channelIO.on("error", (e) => console.log(e));

channelIO.on("connect", (socket) => {
  let clientIp = socket.request.connection.remoteAddress;
  console.log(clientIp);

  socket.on("connect-room", (channelId) => {
    socket.join(channelId);
  });

  socket.on("message", async (message) => {
    let messageSave = { ...message };
    if (message.reply) {
      messageSave.reply = message.reply.id;
    }
    let id = await Message.save(messageSave);
    message.id = id;
    channelIO.to(message.channelId).emit("message", message);
  });

  socket.on("update-message", (data) => {
    socket.to(data.channelId).emit("update-message", data);
  });

  socket.on("delete-message", (data) => {
    socket.to(data.channelId).emit("delete-message", data.messageId);
  });

  socket.on("pin-message", (data) => {
    socket.to(data.channelId).emit("pin-message", data.messageId);
  });

  socket.on("unpin-message", (data) => {
    socket.to(data.channelId).emit("unpin-message", data.messageId);
  });

  socket.on("thumbs-up", (data) => {
    socket.to(data.channelId).emit("thumbs-up", data.messageId);
  });

  socket.on("not-thumbs-up", (data) => {
    socket.to(data.channelId).emit("not-thumbs-up", data.messageId);
  });
});

const roomIO = io.of("/room");
roomIO.on("error", (e) => console.log(e));

roomIO.on("connect", (socket) => {
  const indexRoom = "index";
  console.log("Room connected");
  socket.on("connect-room", (rooms) => {
    let roomsId = rooms.map((room) => room.id);
    roomsId.push(indexRoom);
    socket.join(roomsId);
  });

  socket.on("self-signin", async (data) => {
    await User.online(data.userId);
    let rooms = data.rooms;
    let roomsId = rooms.map((room) => room.id);
    roomsId.push(indexRoom);
    roomsId.forEach((id) => {
      socket.to(id).emit("other-signin", data.userId);
    });
  });

  socket.on("self-signout", async (data) => {
    await User.offline(data.userId);
    let rooms = data.rooms;
    let roomsId = rooms.map((room) => room.id);
    roomsId.push(indexRoom);
    roomsId.forEach((id) => {
      socket.to(id).emit("other-signout", data.userId);
    });
  });

  socket.on("join-room", (data) => {
    socket.to(data.roomId).emit("join-room", data.user);
  });

  socket.on("add-friend", (friendId, user) => {
    socket.to(indexRoom).emit("add-friend", friendId, user);
  });

  socket.on("befriend", (user) => {
    socket.to(indexRoom).emit("befriend", user);
  });

  socket.on("create-channel", (roomId, channelDetail) => {
    socket.to(+roomId).emit("create-channel", channelDetail);
  });
});

const camIO = io.of("/cam");
camIO.on("error", (e) => console.log(e));

camIO.on("connect", (socket) => {
  socket.on("user joined room", async (channelId, userId) => {
    const room = await Stream.getRoom(channelId, userId);

    if (room && room.length === 10) {
      socket.emit("server is full");
      return;
    }

    const otherUsers = [];

    if (room) {
      room.forEach((id) => {
        otherUsers.push(id);
      });
    }
    await Stream.save(channelId, userId, socket.id);
    socket.join(channelId);
    socket.emit("all other users", otherUsers);
  });

  socket.on("peer connection request", ({ userSocketIdToCall, sdp }) => {
    camIO.to(userSocketIdToCall).emit("connection offer", { sdp, callerId: socket.id });
  });

  socket.on("connection answer", ({ userToAnswerTo, sdp }) => {
    camIO.to(userToAnswerTo).emit("connection answer", { sdp, answererId: socket.id });
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    camIO.to(target).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("offer user info", (userSocketIdToCall, user) => {
    camIO.to(userSocketIdToCall).emit("offer user info", socket.id, user);
  });

  socket.on("answer user info", (userSocketIdToAnswer, user) => {
    camIO.to(userSocketIdToAnswer).emit("answer user info", socket.id, user);
  });

  socket.on("disconnecting", () => {
    Stream.delete(socket.id);
    socket.rooms.forEach((room) => {
      socket.to(room).emit("user disconnected", socket.id);
    });
  });

  socket.on("hide cam", (channelId) => {
    socket.to(+channelId).emit("hide cam", socket.id);
  });

  socket.on("show cam", (channelId) => {
    socket.to(+channelId).emit("show cam", socket.id);
  });
});
