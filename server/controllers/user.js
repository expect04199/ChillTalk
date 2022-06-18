const User = require("../models/user");
const Room = require("../models/room");

module.exports.postJoinRoom = async (req, res) => {
  const { room_id: roomId, user_id: userId } = req.body;
  let isExisted = await Room.isExisted(roomId);
  if (!isExisted) {
    return res.send("Room does not existed.");
  }
  await User.joinRoom(+roomId, +userId);
  let roomDetail = await Room.getDetail(roomId, userId);
  let data = {
    id: roomDetail[0].id,
    name: roomDetail[0].room_name,
    picture: roomDetail[0].room_picture,
    channel_id: roomDetail[0].channel_id,
    alert: true,
  };
  console.log(data);
  return res.json(data);
};
