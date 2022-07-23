require("dotenv").config();
const Room = require("../models/room");
const Util = require("../../util/util");

module.exports.getDetail = async (req, res) => {
  const roomId = +req.query.roomId;
  if (!roomId) {
    return res.status(400).json({ error: "Bad Request" });
  }

  const userId = +req.user.id;
  const detail = await Room.getDetail(roomId, userId);
  const channels = await Room.getChannels(roomId);
  const members = await Room.getMembers(roomId);
  const data = {
    ...detail,
    channels,
    members,
  };
  return res.status(200).json(data);
};

module.exports.joinRoom = async (req, res) => {
  const roomId = +req.body.room_id;
  const userId = req.user.id;
  const isExisted = await Room.isExisted(roomId);
  if (!isExisted) {
    return res.status(400).json({ error: "Room does not exist." });
  }
  const join = await Room.join(roomId, userId);
  if (join.error) {
    return res.status(500).json({ error: join.error });
  }
  const detail = await Room.getDetail(roomId, userId);
  return res.status(200).json(detail);
};

module.exports.createRoom = async (req, res) => {
  const { room_name: roomName } = req.body;
  const userId = req.user.id;
  if (!roomName || !roomName.replace(/\s/g, "")) {
    return res.status(403).json({ error: "Incorrect name" });
  }
  const result = await Room.create(req.files, roomName, userId, "public");
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  const roomId = result.roomId;
  const detail = await Room.getDetail(roomId, userId);
  return res.status(200).json(detail);
};

module.exports.getSearchResult = async (req, res) => {
  const { room_id: roomId, from_user: fromUser, channel_name: channelName, pinned, content } = req.query;
  let messages = await Room.search(content, roomId, fromUser, channelName, pinned);
  messages = messages.map((m) => {
    const userPic = Util.getImage(m.preset, m.pic_src, m.user_id, m.pic_type, m.pic_img);
    const message = {
      id: m.id,
      type: m.type,
      channel_id: m.channel_id,
      description: m.description,
      time: m.initial_time,
      user_id: m.user_id,
      name: m.user_name,
      picture: userPic,
    };
    return message;
  });
  return res.status(200).json({ messages });
};

module.exports.updateInfo = async (req, res) => {
  const { id, name, original_name: originalName, original_picture: originalPicture } = req.body;
  const userId = req.user.id;
  const result = await Room.update(+id, name, req.files, userId);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }
  if (!result.name) {
    result.name = originalName;
  }
  if (!result.picture) {
    result.picture = originalPicture;
  }
  return res.status(200).json(result);
};
