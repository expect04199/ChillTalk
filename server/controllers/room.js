require("dotenv").config();
const Room = require("../models/room");

module.exports.getRoom = async (req, res) => {
  const roomId = req.query.id;
  let roomInfo = Room.getInfo();
  console.log(roomInfo);
  console.log(roomId);
};
