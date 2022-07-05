const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { TOKEN_SECRET } = process.env;

module.exports.postSignin = async (req, res) => {
  const { email, password } = req.body;
  const info = await User.signin(email, password);
  if (info.error) {
    return res.status(info.status).send(info.error);
  }
  const payload = { info: info };
  let rooms = await User.findRooms(info.id, "public");
  const access_token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: "24h" });
  let data = {
    access_token,
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
  const payload = {
    info,
    rooms: [],
  };
  const access_token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: "24h" });
  const data = {
    access_token,
    info,
  };
  return res.status(200).json(data);
};

module.exports.getInfo = async (req, res) => {
  const hostId = req.user.id;
  const userId = +req.query.userId;
  const info = await User.getInfo(hostId, userId);
  const rooms = await User.getRooms(hostId, userId);
  const friends = await User.getFriends(hostId, userId);
  return res.status(200).json({ info, rooms, friends });
};

module.exports.updateInfo = async (req, res) => {
  const { name, introduction, original_picture, original_background } = req.body;
  const userId = req.user.id;
  let info = await User.update(req.files, userId, name, introduction);
  if (info.error) {
    return res.status(400).send("Bad Request");
  }
  if (info.picture) {
    info.picture = original_picture;
  }
  if (info.background) {
    info.background = original_background;
  }

  let payload = { info: info };
  let access_token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: "24h" });
  let data = {
    access_token,
    info,
  };
  return res.status(200).json(data);
};
