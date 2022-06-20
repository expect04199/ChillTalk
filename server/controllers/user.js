const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { TOKEN_SECRET } = process.env;
const PREFIX_PICTURE = "https://s2.coinmarketcap.com/static/img/coins/200x200/14447.png";
const PREFIX_BACKGROUND = "https://s2.coinmarketcap.com/static/img/coins/200x200/14447.png";
const PREFIX_INTRODUCTION = "No content";

module.exports.postSignin = async (req, res) => {
  const { email, password } = req.body;
  let result = await User.signin(email, password);
  let rooms = await User.findRooms(result.id);
  let info = {
    id: result.id,
    name: result.name,
    email: result.email,
    picture: result.picture_url,
    background: result.background_url,
    introduction: result.introduction,
    online: true,
  };
  const access_token = jwt.sign(info, TOKEN_SECRET, { expiresIn: "24h" });
  let data = {
    access_token,
    access_expired: 86400,
    info,
    rooms,
  };
  return res.json(data);
};

module.exports.postSignup = async (req, res) => {
  const { name: userName, email, password } = req.body;
  let salt = bcrypt.genSaltSync(10);
  let hashPwd = bcrypt.hashSync(password, salt);
  let result = await User.signup(userName, email, hashPwd);
  const access_token = jwt.sign(result, TOKEN_SECRET, { expiresIn: "24h" });
  let data = {
    access_token,
    access_expired: 86400,
    info: {
      ...result,
      picture: PREFIX_PICTURE,
      background: PREFIX_BACKGROUND,
      introduction: PREFIX_INTRODUCTION,
    },
  };
  return res.json(data);
};
