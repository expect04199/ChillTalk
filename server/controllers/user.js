const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { TOKEN_SECRET } = process.env;

module.exports.postSignin = async (req, res) => {
  const { email, password } = req.body;
  let info = await User.signin(email, password);
  if (info.error) {
    throw info.error;
  }
  let payload = { info: info };
  let rooms = await User.findRooms(info.id);
  const access_token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: "24h" });
  let data = {
    access_token,
    access_expired: 86400,
    info,
    rooms,
  };
  return res.status(200).json(data);
};

module.exports.postSignup = async (req, res) => {
  const { name: userName, email, password } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hashPwd = bcrypt.hashSync(password, salt);
  const info = await User.signup(userName, email, hashPwd);
  if (info.error) {
    return res.status(info.status).send(info.error);
  }
  let payload = {
    info,
    rooms: [],
  };
  const access_token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: "24h" });
  let data = {
    access_token,
    access_expired: 86400,
    info,
  };
  return res.status(200).json(data);
};

module.exports.getInfo = async (req, res) => {
  const hostId = req.user.id;
  const userId = +req.query.userId;
  let data = await User.getInfo(hostId, userId);
  return res.status(200).json(data);
};

module.exports.updateInfo = async (req, res) => {
  const { name, introduction } = req.body;
  const userId = req.user.id;
  let info = await User.update(req.files, userId, name, introduction);
  if (info.error) {
    return res.status(400).send("Bad Request");
  }
  let payload = { info: info };
  let access_token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: "24h" });
  let data = {
    access_token,
    access_expired: 86400,
    info,
  };
  return res.status(200).json(data);
};
