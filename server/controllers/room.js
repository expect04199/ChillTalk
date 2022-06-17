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
      let channel = {
        id: detail.channel_id,
        name: detail.channel_name,
      };
      channels.push(channel);
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
