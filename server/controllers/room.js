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
    alert: true,
  };
  if (channels.length !== 0) {
    data.channel_id = channels[0].id;
  }
  return res.json(data);
};

module.exports.postCreateRoom = async (req, res) => {
  const { room_name: roomName, user_id: userId } = req.body;
  let roomId = await Room.create(req.files, roomName, userId);
  let detail = await Room.getDetail(roomId, userId);
  let data = {
    ...detail,
    alert: true,
  };
  return res.status(200).json(data);
};
