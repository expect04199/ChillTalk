const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { TOKEN_SECRET } = process.env;
const PREFIX_PICTURE = "https://s2.coinmarketcap.com/static/img/coins/200x200/14447.png";
const PREFIX_BACKGROUND = "https://s2.coinmarketcap.com/static/img/coins/200x200/14447.png";
const PREFIX_INTRODUCTION = "No content";

module.exports.postSignin = async (req, res) => {};

module.exports.postSignup = async (req, res) => {
  const { name: userName, email, password } = req.body;
  // check if the user has already existed
  let salt = bcrypt.genSaltSync(10);
  let hashPwd = bcrypt.hashSync(password, salt);
  let result = await User.save(userName, email, hashPwd);
  console.log(result);
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
