require("dotenv").config();
const Room = require("../models/room");

module.exports.getDetail = async (req, res) => {
  const roomId = +req.query.roomId;
  const userId = +req.query.userId;
  let detail = await Room.getDetail(roomId, userId);
  let channels = await Room.getChannels(roomId);
  let members = await Room.getMembers(roomId);
  let data = {
    ...detail,
    channels,
    members,
  };
  return res.status(200).json(data);
};

module.exports.postJoinRoom = async (req, res) => {
  let { room_id: roomId, user_id: userId } = req.body;
  roomId = +roomId;
  userId = +userId;
  let isExisted = await Room.isExisted(roomId);
  if (!isExisted) {
    return res.status(400).send("Room does not exist.");
  }
  await Room.join(roomId, userId);
  let detail = await Room.getDetail(roomId, userId);
  let channels = await Room.getChannels(roomId);
  let data = {
    ...detail,
  };
  if (channels.length !== 0) {
    data.channel_id = channels[0].id;
  }
  return res.json(data);
};

module.exports.postCreateRoom = async (req, res) => {
  const { room_name: roomName, user_id: userId } = req.body;
  let roomId = await Room.create(req.files, roomName, userId, "public");
  let detail = await Room.getDetail(roomId, userId);
  let data = {
    ...detail,
  };
  return res.status(200).json(data);
};

module.exports.getSearchResult = async (req, res) => {
  const {
    room_id: roomId,
    from_user: fromUser,
    channel_name: channelName,
    pinned,
    content,
  } = req.query;
  let messages = await Room.search(content, roomId, fromUser, channelName, pinned);
  return res.status(200).json({ messages });
};

module.exports.updateInfo = async (req, res) => {
  const { id, name, original_name: originalName, original_picture: originalPicture } = req.body;
  const userId = req.user.id;
  let result = await Room.update(+id, name, req.files, userId);
  if (result.error) {
    return res.status(400).send("Bad request");
  }
  if (!result.name) {
    result.name = originalName;
  }
  if (!result.picture) {
    result.picture = originalPicture;
  }
  return res.status(200).json(result);
};
