const Message = require("../models/message");

module.exports.getMessages = async (req, res) => {
  const { channelId } = req.query;
  const paging = +req.query.paging || 1;
  if (!channelId) {
    return res.status(400).send("Bad Request");
  }
  let result = await Message.get(channelId, paging);
  return res.status(200).json(result);
};

module.exports.updateContent = async (req, res) => {
  const { message_id: messageId, type, description } = req.body;
  let result = await Message.update(messageId, type, description);
  if (result.error) {
    return res.status(403).send("Can not update message.");
  }
  return res.status(200).json({ message_id: messageId });
};

module.exports.deleteContent = async (req, res) => {
  const { message_id: messageId } = req.body;
  let result = await Message.delete(messageId);
  if (result.error) {
    return res.status(403).send("Can not delete message.");
  }
  return res.status(200).json({ message_id: messageId });
};

module.exports.pinContent = async (req, res) => {
  const { message_id } = req.body;
  let result = await Message.pin(message_id);
  return res.status(200);
};

module.exports.unpinContent = async (req, res) => {
  const { message_id } = req.body;
  let result = await Message.unpin(message_id);
  return res.status(200);
};

module.exports.postThumbsUp = async (req, res) => {
  const { user_id: userId, message_id: messageId } = req.body;
  let result = await Message.postThumbsUp(userId, messageId);
  if (result.error) {
    return res.status(500).json("Can not save thumbs up");
  }
  return res.status(200).json(result);
};

module.exports.deleteThumbsUp = async (req, res) => {
  const { user_id: userId, message_id: messageId } = req.body;
  let result = await Message.deleteThumbsUp(userId, messageId);
  if (result.error) {
    return res.status(500).json("Can not delelte thumbs up");
  }
  return res.status(200).json(result);
};
