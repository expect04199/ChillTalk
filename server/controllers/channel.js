const Channel = require("../models/channel");

module.exports.getDetail = async (req, res) => {
  const { channelId } = req.query;
  let detail = await Channel.getDetail(channelId);
  return res.status(200).json(detail);
};

module.exports.createChannel = async (req, res) => {
  const { channel_type: channelType, channel_name: channelName, room_id: roomId } = req.body;
  let id = await Channel.save(channelType, channelName, roomId);
  let data = {
    id,
    type: channelType,
    name: channelName,
  };
  return res.status(200).json(data);
};
