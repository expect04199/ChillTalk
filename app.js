require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

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

// API docs
app.use(
  "/api-docs", // 設定查看api文件的路徑
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, swaggerOpt)
);

app.use("/api", [require("./server/routes/room")]);

app.listen(SERVER_PORT, () => {
  console.log("Server Connected.");
});
