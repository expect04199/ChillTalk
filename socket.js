const app = require("./app");
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// models
const Message = require("./server/models/message");
const User = require("./server/models/user");

// channel socket
const channelIO = io.of("/channel");
channelIO.on("error", (e) => console.log(e));

channelIO.on("connect", (socket) => {
  console.log("channel connected");
  socket.on("connect-room", (channelId) => {
    socket.join(channelId);
  });

  socket.on("message", async (message) => {
    const messageSave = { ...message };
    if (message.reply) {
      messageSave.reply = +message.reply.id;
    }
    const id = await Message.save(messageSave);
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

// room socket
const roomIO = io.of("/room");
roomIO.on("error", (e) => console.log(e));

roomIO.on("connect", (socket) => {
  const indexRoom = "index";
  console.log("Room connected");
  socket.on("connect-room", (rooms) => {
    rooms = rooms.map((room) => room.id);
    rooms.push(indexRoom);
    socket.join(rooms);
  });

  socket.on("self-signin", async (data) => {
    await User.online(data.userId);
    const rooms = data.rooms.map((room) => room.id);
    rooms.push(indexRoom);
    rooms.forEach((id) => {
      socket.to(id).emit("other-signin", data.userId);
    });
  });

  socket.on("self-signout", async (data) => {
    await User.offline(data.userId);
    const rooms = data.rooms.map((room) => room.id);
    rooms.push(indexRoom);
    rooms.forEach((id) => {
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
    socket.to(roomId).emit("create-channel", channelDetail);
  });
});

const camIO = io.of("/cam");
camIO.on("error", (e) => console.log(e));

camIO.on("connect", (socket) => {
  socket.on("user joined room", async (channelId) => {
    const sockets = (await camIO.in(channelId).fetchSockets()).map((s) => s.id);

    if (sockets && sockets.length === 9) {
      socket.emit("server is full");
      return;
    }

    socket.join(channelId);
    socket.emit("all other users", sockets);
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
    socket.rooms.forEach((room) => {
      socket.to(room).emit("user disconnected", socket.id);
    });
  });

  socket.on("hide cam", (channelId) => {
    socket.to(channelId).emit("hide cam", socket.id);
  });

  socket.on("show cam", (channelId) => {
    socket.to(channelId).emit("show cam", socket.id);
  });
});

module.exports = { io, server };
