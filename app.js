require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// models
const Message = require("./server/models/message");

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

app.use("/api", [require("./server/routes/room"), require("./server/routes/channel")]);

server.listen(SERVER_PORT, () => {
  console.log("Server Connected.");
});

//socket section
io.sockets.on("error", (e) => console.log(e));

io.sockets.on("connect", (socket) => {
  var clientIp = socket.request.connection.remoteAddress;
  console.log(clientIp);

  socket.on("connect-room", (channelId) => {
    socket.join(channelId);
  });

  socket.on("message", async (message) => {
    console.log(message);
    socket.to(message.channelId).emit("message", message);
    await Message.save(message);
    console.log("done");
  });
});
