const Channel = require("../models/channel");
const Util = require("../../util/util");

module.exports.getPinMessages = async (req, res) => {
  const channelId = +req.query.channelId;
  if (!channelId) {
    return res.status(400).json({ error: "Bad Request" });
  }

  let messages = await Channel.getPinMessages(channelId);
  if (!messages.length) {
    return res.status(200).json({ messages: [] });
  }
  messages = messages.map((m) => {
    const userPic = Util.getImage(m.pic_preset, m.pic_src, m.user_id, m.pic_type, m.pic_img);
    const message = {
      id: m.msg_id,
      type: m.msg_type,
      channel_id: m.id,
      description: m.msg_desc,
      time: m.msg_time,
      user_id: m.user_id,
      name: m.user_name,
      picture: userPic,
    };
    return message;
  });
  return res.status(200).json({ messages });
};

module.exports.createChannel = async (req, res) => {
  const { channel_type: channelType, channel_name: channelName, room_id: roomId } = req.body;
  const userId = req.user.id;

  if (!channelType || !channelName || !roomId) {
    res.status(400).json({ error: "Bad Request" });
  }

  const result = await Channel.save(channelType, channelName, +roomId, userId);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  const data = {
    id: result.id,
    type: channelType,
    name: channelName,
  };
  return res.status(200).json(data);
};
