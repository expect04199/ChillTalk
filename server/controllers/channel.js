const Channel = require("../models/channel");

module.exports.getDetail = async (req, res) => {
  const { roomId, channelId } = req.query;
  let details = await Channel.getDetail(channelId);
  let messages = [];
  let data = {};
  details.forEach((detail) => {
    data.id = detail.channelId;
    data.name = detail.name;
    data.channel_type = detail.channel_type;
    let message = {
      id: detail.message_id,
      type: detail.type,
      channel_id: detail.channel_id,
      description: detail.description,
      time: detail.time,
      user_id: detail.user_id,
      name: detail.name,
      picture: detail.url,
    };
    messages.push(message);
  });
  data.messages = messages;
  return res.json(data);
};
