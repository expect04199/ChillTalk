const Message = require("../models/message");
const Util = require("../../util/util");
const PAGESIZE = 12; // use read session as basis

module.exports.getMessages = async (req, res) => {
  const channelId = +req.query.channelId;
  const userId = +req.query.userId;
  const pageTakeCount = 3;
  let paging = +req.query.paging || 1;

  if (!channelId) {
    return res.status(400).json({ error: "Bad Request" });
  }

  // if user id exist, find from user read record
  let readSession;
  if (userId) {
    const session = await Message.getReadSession(channelId, userId);
    readSession = session;
  }

  // if user has read record, start from read record , or start from latest message
  let sessionTake;
  let sessionStart;
  if (userId && readSession) {
    const order = await Message.getReverseOrder(channelId, readSession);
    paging = Math.ceil(order / PAGESIZE);
    sessionTake = PAGESIZE * pageTakeCount + 1; // +1 is to check if next page exist
    sessionStart = paging < pageTakeCount ? 0 : (paging - Math.ceil(pageTakeCount / 2)) * PAGESIZE; // ensure read session will be taken in the middle
  } else {
    sessionTake = PAGESIZE + 1;
    sessionStart = (paging - 1) * PAGESIZE;
  }

  let messages = await Message.getBySessions(channelId, sessionTake, sessionStart);

  // collect all sessions
  const sessions = [];
  messages.forEach((r) => {
    if (!sessions.includes(r.session)) {
      sessions.push(r.session);
    }
  });

  let next_paging;
  let prev_paging;
  if (userId && readSession) {
    if (sessions.length > PAGESIZE * pageTakeCount) {
      next_paging = paging === 1 ? paging + pageTakeCount : paging + pageTakeCount - 1;
      messages = messages.filter((r) => r.session > messages[0].session);
    }
    if (paging > Math.ceil(pageTakeCount / 2)) {
      prev_paging = paging - Math.ceil(pageTakeCount / 2);
    }
  } else {
    if (sessions.length > PAGESIZE) {
      next_paging = paging + 1;
      messages = messages.filter((r) => r.session > messages[0].session);
    }
    if (paging > 1) {
      prev_paging = paging - 1;
    }
  }

  messages = messages.map((msg) => {
    const userPic = Util.getImage(msg.preset, msg.pic_src, msg.user_id, msg.pic_type, msg.pic_img);
    const message = {
      id: msg.id,
      type: msg.type,
      channel_id: msg.channel_id,
      description: msg.description,
      time: msg.initial_time,
      user_id: msg.user_id,
      name: msg.user_name,
      picture: userPic,
      is_edited: msg.is_edited,
      pinned: msg.pinned,
      session: msg.session,
    };
    if (msg.likes[0]) {
      message.thumbs = msg.likes;
    }
    if (msg.reply_id) {
      const replyPic = Util.getImage(msg.reply_preset, msg.reply_pic_src, msg.reply_user_id, msg.reply_pic_type, msg.reply_pic_img);
      const reply = {
        id: msg.reply_id,
        name: msg.reply_name,
        description: msg.reply_description,
        picture: replyPic,
      };
      message.reply = reply;
    }
    return message;
  });

  return res.status(200).json({ read_session: readSession, messages, next_paging, prev_paging });
};

module.exports.updateMessage = async (req, res) => {
  const { message_id: messageId, type, description } = req.body;
  const result = await Message.update(messageId, type, description);
  if (result.error) {
    return res.status(403).json({ error: "Can not update message." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.deleteMessage = async (req, res) => {
  const messageId = +req.body.message_id;
  const result = await Message.delete(messageId);
  if (result.error) {
    return res.status(403).json({ error: "Can not delete message." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.pinContent = async (req, res) => {
  const messageId = +req.body.message_id;
  const result = await Message.pin(messageId);
  if (result.error) {
    return res.status(500).json({ error: "Can not pin message." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.unpinContent = async (req, res) => {
  const messageId = +req.body.message_id;
  const result = await Message.unpin(messageId);
  if (result.error) {
    return res.status(500).json({ error: "Can not unpin message." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.postLike = async (req, res) => {
  const messageId = +req.body.message_id;
  const userId = req.user.id;
  const result = await Message.postLike(userId, messageId);
  if (result.error) {
    return res.status(500).json({ error: "Can not save thumbs up." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.deleteLike = async (req, res) => {
  const messageId = +req.body.message_id;
  const userId = req.user.id;
  const result = await Message.deleteLike(userId, messageId);
  if (result.error) {
    return res.status(500).json({ error: "Can not delete thumbs up." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.postReadStatus = async (req, res) => {
  const { room_id: roomId, channel_id: channelId, message_id: messageId } = req.body;
  const userId = req.user.id;
  const result = await Message.read(userId, +roomId, +channelId, +messageId);
  if (result.error) {
    return res.status(500).json({ error: "Internal server error." });
  }
  return res.status(200).json({ msg: "success" });
};

module.exports.getMail = async (req, res) => {
  const userId = req.user.id;
  const messages = await Message.getMail(userId);
  if (messages.error) {
    return res.status(500).json({ error: "Can not get mail." });
  }
  return res.status(200).json(messages);
};
