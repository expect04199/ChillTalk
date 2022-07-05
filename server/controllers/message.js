const Message = require("../models/message");

module.exports.getMessages = async (req, res) => {
  const channelId = +req.query.channelId;
  const userId = req.user.id;
  const paging = +req.query.paging || 1;
  if (!channelId) {
    return res.status(400).json({ error: "Bad Request" });
  }
  let result = await Message.get(+channelId, paging, userId);
  return res.status(200).json(result);
};

module.exports.updateMessage = async (req, res) => {
  const { message_id: messageId, type, description } = req.body;
  let result = await Message.update(messageId, type, description);
  if (result.error) {
    return res.status(403).json({ error: "Can not update message." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.deleteMessage = async (req, res) => {
  const { message_id: messageId } = req.body;
  let result = await Message.delete(+messageId);
  if (result.error) {
    return res.status(403).json({ error: "Can not delete message." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.pinContent = async (req, res) => {
  const { message_id: messageId } = req.body;
  let result = await Message.pin(messageId);
  if (result.error) {
    return res.status(500).json({ error: "Can not pin message." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.unpinContent = async (req, res) => {
  const { message_id: messageId } = req.body;
  let result = await Message.unpin(messageId);
  if (result.error) {
    return res.status(500).json({ error: "Can not unpin message." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.postThumbsUp = async (req, res) => {
  const { message_id: messageId } = req.body;
  const userId = req.user.id;
  let result = await Message.postThumbsUp(userId, messageId);
  if (result.error) {
    return res.status(500).json({ error: "Can not save thumbs up." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.deleteThumbsUp = async (req, res) => {
  const { message_id: messageId } = req.body;
  const userId = req.user.id;
  let result = await Message.deleteThumbsUp(userId, messageId);
  if (result.error) {
    return res.status(500).json({ error: "Can not delete thumbs up." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.postReadStatus = async (req, res) => {
  const { room_id: roomId, channel_id: channelId, message_id: messageId } = req.body;
  const userId = req.user.id;
  let result = await Message.read(userId, roomId, channelId, messageId);
  if (result.error) {
    return res.status(500).json({ error: "Internal server error." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.getMail = async (req, res, next) => {
  const userId = req.user.id;
  let messages = await Message.getMail(userId);
  if (messages.error) {
    return res.status(500).json({ error: "Can not get mail." });
  }
  return res.status(200).json(messages);
};
