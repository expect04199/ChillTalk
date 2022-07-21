const Friend = require("../models/friend");
const Util = require("../../util/util");

module.exports.addFriend = async (req, res) => {
  const hostId = req.user.id;
  const userId = +req.body.user_id;
  if (hostId === userId) {
    return res.status(400).json({ error: "Can not add yourself." });
  }
  let result = await Friend.addFriend(hostId, userId);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(204);
};

module.exports.getRequests = async (req, res) => {
  const hostId = req.user.id;
  const reqs = await Friend.getRequests(hostId);

  const users = [];
  reqs.forEach((r) => {
    const userPic = Util.getImage(r.preset, r.pic_src, r.id, r.pic_type, r.pic_img);
    const user = {
      id: r.id,
      name: r.name,
      picture: userPic,
      online: r.online,
    };
    users.push(user);
  });

  return res.status(200).json({ users });
};

module.exports.acceptRequest = async (req, res) => {
  const hostId = req.user.id;
  const userId = +req.body.user_id;
  const data = await Friend.acceptRequest(hostId, userId);
  if (data.error) {
    return res.status(400).json({ error: data.error });
  }
  return res.status(200).json(data);
};

module.exports.deleteRequest = async (req, res) => {
  const hostId = req.user.id;
  const userId = +req.body.user_id;
  const result = await Friend.deleteRequest(hostId, userId);
  if (result.error) {
    return res.status(400).send("Bad request");
  }
  return res.status(204);
};

module.exports.getFriends = async (req, res) => {
  const hostId = req.user.id;

  let friends = await Friend.getFriends(hostId);
  friends = friends.map((f) => {
    const friendPic = Util.getImage(f.pic_preset, f.pic_src, f.id, f.pic_type, f.pic_img);
    const friend = {
      id: f.id,
      name: f.name,
      online: f.online,
      picture: friendPic,
      last_message_time: f.initial_time,
      room_id: f.room_id,
      channel_id: f.channel_id,
    };
    return friend;
  });

  return res.status(200).json({ friends });
};
