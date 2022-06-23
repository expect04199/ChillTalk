const Message = require("../models/message");

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
