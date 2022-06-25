require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");

// models
const Message = require("./server/models/message");
const User = require("./server/models/user");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(cors());

const { SERVER_PORT } = process.env;

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const swaggerOpt = {
  swaggerOptions: {
    tryItOutEnabled: false,
    supportedSubmitMethods: [""],
  },
};

// Initialize socket server
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// API docs
app.use(
  "/api-docs", // 設定查看api文件的路徑
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, swaggerOpt)
);

app.use("/api", [
  require("./server/routes/room"),
  require("./server/routes/channel"),
  require("./server/routes/user"),
  require("./server/routes/message"),
]);

app.use((err, req, res, next) => {
  console.log(err);
  return res.status(500).send("Internal Server Error");
});

server.listen(SERVER_PORT, () => {
  console.log("Server Connected.");
});

//socket section
let channelIO = io.of("/channel");
channelIO.on("error", (e) => console.log(e));

channelIO.on("connect", (socket) => {
  let clientIp = socket.request.connection.remoteAddress;
  console.log(clientIp);

  socket.on("connect-room", (channelId) => {
    socket.join(channelId);
  });

  socket.on("message", async (message) => {
    console.log(message);
    let id = await Message.save(message);
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

let roomIO = io.of("/room");
roomIO.on("error", (e) => console.log(e));

roomIO.on("connect", (socket) => {
  console.log("Room connected");
  socket.on("connect-room", (rooms) => {
    let roomsId = rooms.map((room) => room.id);
    socket.join(roomsId);
  });

  socket.on("self-signin", async (data) => {
    await User.online(data.userId);
    let rooms = data.rooms;
    rooms.forEach((room) => {
      socket.to(room.id).emit("other-signin", data.userId);
    });
  });

  socket.on("self-signout", async (data) => {
    await User.offline(data.userId);
    let rooms = data.rooms;
    rooms.forEach((room) => {
      socket.to(room.id).emit("other-signout", data.userId);
    });
  });
});
