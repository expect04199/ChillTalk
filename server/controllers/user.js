const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const { TOKEN_SECRET } = process.env;

module.exports.postSignin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    console.log("hihi");
    return res.status(403).json({ error: "Wrong email or password" });
  }
  const info = await User.signin(email, password);
  if (info.error) {
    return res.status(info.status).json({ error: info.error });
  }
  const payload = { info: info };
  const rooms = await User.findRooms(info.id, "public");
  const access_token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: "24h" });
  const data = {
    access_token,
    info,
    rooms,
  };
  return res.status(200).json(data);
};

module.exports.postSignup = async (req, res) => {
  let { name: userName, email, password } = req.body;
  if (!userName || !email || !password) {
    return res.status(400).json({ error: "Name, email or password is invalid" });
  }

  if (userName.length > 20 || email.length > 20 || password.length > 20) {
    return res.status(400).json({ error: "Name, email or password is invalid" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Name, email or password is invalid" });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashPwd = bcrypt.hashSync(password, salt);
  const info = await User.signup(userName, email, hashPwd);
  if (info.error) {
    return res.status(info.status).json({ error: info.error });
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
  const info = await User.getInfo(userId);
  const rooms = await User.getRooms(hostId, userId);
  const friends = await User.getFriends(hostId, userId);
  return res.status(200).json({ info, rooms, friends });
};

module.exports.updateInfo = async (req, res) => {
  const { name, introduction, original_picture, original_background } = req.body;
  const userId = req.user.id;
  const info = await User.update(req.files, userId, name, introduction);
  if (info.error) {
    return res.status(info.status).json({ error: info.error });
  }
  if (!info.picture) {
    info.picture = original_picture;
  }
  if (!info.background) {
    info.background = original_background;
  }

  const payload = { info: info };
  const access_token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: "24h" });
  const data = {
    access_token,
    info,
  };
  return res.status(200).json(data);
};
