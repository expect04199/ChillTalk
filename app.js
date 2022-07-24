require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.set("trust proxy", true);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(cors());

app.use("/api", [require("./server/routes/room"), require("./server/routes/channel"), require("./server/routes/user"), require("./server/routes/message"), require("./server/routes/friend")]);

app.use("*", (req, res) => {
  return res.status(404).send("Not Found");
});

app.use((err, req, res, next) => {
  console.log(err);
  return res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
