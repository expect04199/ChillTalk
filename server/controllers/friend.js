const Friend = require("../models/friend");

module.exports.postAddFriend = async (req, res) => {
  const hostId = +req.user.id;
  const { user_id: userId } = req.body;
  let result = await Friend.addFriend(hostId, userId);
  if (result.error || hostId === userId) {
    return res.status(400).send("Bad Request");
  }
  return res.status(200).send("success");
};
