require("dotenv").config();
const Room = require("../models/room");

module.exports.getDetail = async (req, res) => {
  const roomId = +req.query.roomId;
  const userId = +req.query.userId;
  let details = await Room.getDetail(roomId, userId);
  let data = {};
  let channels = [];
  let members = {};
  details.forEach((detail) => {
    data.id = detail.id;
    data.picture = detail.room_picture;
    data.name = detail.room_name;
    if (userId === detail.user_id) {
      data.is_mute = Date.now() < detail.mute;
      data.notification = detail.notification;
      if (detail.channel_id) {
        let channel = {
          id: detail.channel_id,
          name: detail.channel_name,
        };
        channels.push(channel);
      }
    }
    let member = {
      id: detail.user_id,
      name: detail.user_name,
      email: detail.user_email,
      picture: detail.user_picture,
      background: detail.user_background,
      introduction: detail.user_introduction,
      online: detail.user_online,
    };
    if (!members[member.id]) {
      members[member.id] = member;
    }
  });
  data.channels = channels;
  data.members = Object.values(members);
  return res.json(data);
};

module.exports.postJoinRoom = async (req, res) => {
  const { room_id: roomId, user_id: userId } = req.body;
  let isExisted = await Room.isExisted(roomId);
  if (!isExisted) {
    return res.send("Room does not existed.");
  }
  await Room.join(+roomId, +userId);
  let roomDetail = await Room.getDetail(roomId);
  let data = {
    id: roomDetail[0].id,
    name: roomDetail[0].room_name,
    picture: roomDetail[0].room_picture,
    channel_id: roomDetail[0].channel_id,
    alert: true,
  };
  return res.json(data);
};

module.exports.postCreateRoom = async (req, res) => {
  const { room_name: roomName, user_id: userId } = req.body;
  let roomId = await Room.create(roomName, userId);
  let roomDetail = await Room.getDetail(roomId, userId);
  let data = {
    id: roomDetail[0].id,
    name: roomDetail[0].room_name,
    picture: roomDetail[0].room_picture,
    host_id: userId,
    alert: true,
  };
  return res.json(data);
};
