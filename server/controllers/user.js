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
  let rooms = await User.findRooms(info.id);
  const access_token = jwt.sign(info, TOKEN_SECRET, { expiresIn: "24h" });
  console.log(access_token);
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
