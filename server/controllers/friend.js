const Friend = require("../models/friend");

module.exports.postAddFriend = async (req, res) => {
  const hostId = req.user.id;
  const { user_id: userId } = req.body;
  if (hostId === userId) {
    return res.status(400).json({ error: "Can not add yourself." });
  }
  let result = await Friend.addFriend(hostId, userId);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.getRequests = async (req, res) => {
  const hostId = req.user.id;
  let users = await Friend.getRequests(hostId);
  return res.status(200).json({ users });
};

module.exports.acceptRequest = async (req, res) => {
  const hostId = +req.user.id;
  const { user_id: userId } = req.body;
  let data = await Friend.acceptRequest(hostId, userId);
  if (data.error) {
    return res.status(400).json({ error: data.error });
  }
  return res.status(200).json(data);
};

module.exports.deleteRequest = async (req, res) => {
  const hostId = req.user.id;
  const { user_id: userId } = req.body;
  let result = await Friend.deleteRequest(hostId, userId);
  if (result.error) {
    return res.status(400).send("Bad request");
  }
  return res.status(200).send("success");
};

module.exports.getFriends = async (req, res) => {
  let hostId = req.user.id;
  let friends = await Friend.getFriends(hostId);
  return res.status(200).json({ friends });
};
