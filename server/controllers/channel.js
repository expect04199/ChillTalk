const Channel = require("../models/channel");

module.exports.getDetail = async (req, res) => {
  const { roomId, channelId } = req.query;
  let details = await Channel.getDetail(channelId);
  let messages = [];
  let data = {};
  details.forEach((detail) => {
    data.id = detail.id;
    data.name = detail.channel_name;
    data.channel_type = detail.channel_type;
    if (!detail.message_id) return;
    let message = {
      id: detail.message_id,
      type: detail.message_type,
      channel_id: detail.id,
      description: detail.description,
      time: detail.time,
      user_id: detail.user_id,
      name: detail.user_name,
      picture: detail.url,
    };
    messages.push(message);
  });
  data.messages = messages;
  return res.json(data);
};
