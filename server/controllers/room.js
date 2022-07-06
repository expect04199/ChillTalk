require("dotenv").config();
const Room = require("../models/room");

module.exports.getDetail = async (req, res) => {
  const roomId = +req.query.roomId;
  const userId = +req.user.id;
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
  const { room_id: roomId } = req.body;
  const userId = req.user.id;
  let isExisted = await Room.isExisted(roomId);
  if (!isExisted) {
    return res.status(400).json({ error: "Room does not exist." });
  }
  let isJoin = await Room.join(roomId, userId);
  if (isJoin.error) {
    return res.status(500).json({ error: isJoin.error });
  }
  let detail = await Room.getDetail(roomId, userId);
  let channels = await Room.getChannels(roomId);
  if (channels.length !== 0) {
    detail.channel_id = channels[0].id;
  }
  return res.status(200).json(detail);
};

module.exports.postCreateRoom = async (req, res) => {
  const { room_name: roomName } = req.body;
  const userId = req.user.id;
  let roomId = await Room.create(req.files, roomName, userId, "public");
  if (roomId.error) {
    return res.status(roomId.status).json({ error: roomId.error });
  }
  let detail = await Room.getDetail(roomId, userId);
  return res.status(200).json(detail);
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
