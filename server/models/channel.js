const db = require("../../util/database");
const Util = require("../../util/util");

module.exports = class Channel {
  static async getDetail(channelId, pinned) {
    let sql = `
    SELECT a.id, a.name, a.type, b.id AS message_id, b.reply, b.pinned,c.type AS message_type, c.description AS message_description, c.time, 
    d.id AS user_id, d.name AS user_name,
    e.source AS pic_src, e.type AS pic_type, e.image AS pic_img, e.preset, f.user_id AS thumb
    FROM channels a
    LEFT JOIN messages b on a.id = b.channel_id
    LEFT JOIN message_contents c on b.id = c.message_id
    LEFT JOIN users d on b.user_id = d.id
    LEFT JOIN pictures e on d.id = e.source_id AND e.source = "user" AND e.type = "picture"
    LEFT JOIN likes f on b.id = f.message_id 
    `;

    if (pinned) {
      sql += ` WHERE a.id = ? AND b.pinned = 1 GROUP BY b.id `;
    } else {
      sql += ` WHERE a.id = ?`;
    }

    let [details] = await db.query(sql, [channelId]);
    if (!details.length) {
      return details;
    }
    let messageMap = {};
    details.forEach((detail) => {
      const userPic = Util.getImage(
        detail.preset,
        detail.pic_src,
        detail.user_id,
        detail.pic_type,
        detail.pic_img
      );
      if (!detail.message_id) return;
      let message = {
        id: detail.message_id,
        type: detail.message_type,
        channel_id: detail.id,
        description: detail.message_description,
        time: detail.time,
        user_id: detail.user_id,
        name: detail.user_name,
        picture: userPic,
      };
      if (detail.reply) {
        message.reply = detail.reply;
      }
      if (detail.pinned) {
        message.pinned = detail.pinned;
      }
      if (detail.thumb) {
        message.thumbs = [detail.thumb];
      }
      if (!messageMap[message.id]) {
        messageMap[message.id] = message;
      } else if (messageMap[message.id].time < message.time) {
        messageMap[message.id].description = message.description;
        messageMap[message.id].is_edit = true;
        if (message.thumbs) {
          messageMap[message.id].thumbs.push(message.thumbs[0]);
        }
      } else if (messageMap[message.id].time > message.time) {
        messageMap[message.id].time = message.time;
        messageMap[message.id].is_edit = true;
        if (message.thumbs) {
          messageMap[message.id].thumbs.push(message.thumbs[0]);
        }
      } else {
        if (message.thumbs) {
          messageMap[message.id].thumbs.push(message.thumbs[0]);
        }
      }
    });
    let messages = Object.values(messageMap);
    let channelDetail = {
      id: details[0].id,
      name: details[0].name,
      channel_type: details[0].type,
      messages,
    };
    return channelDetail;
  }

  static async save(type, name, roomId) {
    const conn = await db.getConnection();
    try {
      let sql = `
      INSERT INTO channels SET ?
      `;
      let data = {
        type,
        name,
        room_id: roomId,
      };
      let [result] = await conn.query(sql, data);
      return result.insertId;
    } catch (error) {
      console.log(error);
      return { error: "Can not create channel", status: 500 };
    } finally {
      await conn.release();
    }
  }
};
