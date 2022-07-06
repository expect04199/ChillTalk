const Channel = require("../models/channel");

module.exports.getDetail = async (req, res) => {
  const { channelId, pinned } = req.query;
  let detail = await Channel.getDetail(channelId, pinned);
  return res.status(200).json(detail);
};

module.exports.createChannel = async (req, res) => {
  const { channel_type: channelType, channel_name: channelName, room_id: roomId } = req.body;
  let id = await Channel.save(channelType, channelName, roomId);
  if (id.error) {
    return res.status(id.status).json({ error: id.error });
  }
  let data = {
    id,
    type: channelType,
    name: channelName,
  };
  return res.status(200).json(data);
};
