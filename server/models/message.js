const db = require("../../util/database");
const Util = require("../../util/util");
const PAGESIZE = 2;

module.exports = class Message {
  constructor(userId, channelId, time, isDeleted, reply, pinned, description) {
    this.user_id = userId;
    this.channel_id = channelId;
    this.time = time;
    this.is_deleted = isDeleted;
    this.reply = reply;
    this.pinned = pinned;
    this.description = description;
  }

  static async isExisted(id) {
    let sql = "SELECT * FROM messages WHERE id = ?";
    let result = await db.query(sql, [id]);
    return result.length !== 0;
  }

  static async save(message) {
    try {
      await db.query("START TRANSACTION");
      let messageSql = "INSERT INTO messages SET ?";
      let msg = {
        user_id: message.userId,
        channel_id: message.channelId,
        initial_time: message.time,
      };
      if (message.reply) {
        msg.reply = +message.reply;
      }
      let result = await db.query(messageSql, msg);
      let insertId = result[0].insertId;

      let contentSql = "INSERT INTO message_contents SET ?";
      let content = {
        message_id: insertId,
        type: message.type,
        description: message.description,
        time: message.time,
      };
      await db.query(contentSql, content);
      await db.query("COMMIT");
      return insertId;
    } catch (error) {
      await db.query("ROLLBACK");
      console.log(error);
    }
  }

  static async get(channelId, paging = 1) {
    let sql = `
    SELECT a.*, b.type, b.description, c.name user_name,
    d.source pic_src, d.type pic_type, d.image pic_img, d.preset, JSON_ARRAYAGG(e.user_id) thumbs, r.*
    FROM chilltalk.messages a
    LEFT JOIN chilltalk.message_contents b ON a.id = b.message_id
    INNER JOIN (SELECT max(id) id FROM chilltalk.message_contents GROUP BY message_id) b1 ON b.id = b1.id
    LEFT JOIN chilltalk.users c ON a.user_id = c.id
    LEFT JOIN chilltalk.pictures d ON c.id = d.source_id AND d.source = "user" AND d.type = "picture"
    LEFT JOIN chilltalk.likes e ON a.id = e.message_id
    left JOIN (
      SELECT f.id reply_id, f.user_id reply_user_id, g.description reply_description, h.name reply_name,
      i.source reply_pic_src, i.type reply_pic_type, i.image reply_pic_img, i.preset reply_preset
      FROM chilltalk.messages f
      LEFT JOIN chilltalk.message_contents g ON f.id = g.message_id
      INNER JOIN (SELECT max(id) id FROM chilltalk.message_contents GROUP BY message_id) g1 ON g.id = g1.id
      LEFT JOIN chilltalk.users h ON f.user_id = h.id
      LEFT JOIN chilltalk.pictures i ON h.id = i.source_id AND i.source = "user" AND i.type = "picture"
    ) as r 
    ON a.reply = r.reply_id 
    WHERE 1=1 `;
    const contraints = [];
    if (channelId) {
      sql += "AND a.channel_id = ? ";
      contraints.push(channelId);
    }
    sql += "GROUP BY a.id ";
    if (paging) {
      const takeCount = PAGESIZE + 1;
      const startCount = (paging - 1) * PAGESIZE;
      sql += "LIMIT ? OFFSET ?";
      contraints.push(takeCount, startCount);
    }
    const [result] = await db.query(sql, contraints);
    const messages = [];
    result.forEach((msg) => {
      const userPic = Util.getImage(
        msg.preset,
        msg.pic_src,
        msg.user_id,
        msg.pic_type,
        msg.pic_img
      );
      let message = {
        id: msg.id,
        type: msg.type,
        channel_id: msg.channel_id,
        description: msg.description,
        time: msg.initial_time,
        user_id: msg.user_id,
        name: msg.user_name,
        picture: userPic,
        is_edited: msg.is_edited,
      };
      if (msg.thumbs[0]) {
        message.thumbs = msg.thumbs;
      }
      if (msg.reply_id) {
        const replyPic = Util.getImage(
          msg.reply_preset,
          msg.reply_pic_src,
          msg.reply_user_id,
          msg.reply_pic_type,
          msg.reply_img
        );
        let reply = {
          id: msg.reply_id,
          name: msg.reply_name,
          description: msg.reply_description,
          picture: replyPic,
        };
        message.reply = reply;
      }
      messages.push(message);
    });
    return messages;
  }

  static async update(id, type, description) {
    try {
      let sql = `INSERT INTO message_contents SET ?`;
      let time = Date.now();
      let message = {
        message_id: id,
        type,
        description,
        time,
      };
      await db.query(sql, message);
      return true;
    } catch (error) {
      console.log(error);
      return { error };
    }
  }

  static async delete(id) {
    try {
      let sql = "DELETE FROM messages WHERE id = ?";
      await db.query(sql, +id);
      return true;
    } catch (error) {
      console.log(error);
      return { error };
    }
  }

  static async pin(id) {
    try {
      let sql = `UPDATE messages SET pinned = 1 WHERE id = ?`;
      await db.query(sql, id);
      return true;
    } catch (error) {
      console.log(error);
      return { error };
    }
  }

  static async unpin(id) {
    try {
      let sql = `UPDATE messages SET pinned = 0 WHERE id = ?`;
      await db.query(sql, id);
      return true;
    } catch (error) {
      console.log(error);
      return { error };
    }
  }

  static async postThumbsUp(userId, messageId) {
    let data = {
      user_id: userId,
      message_id: messageId,
    };
    let sql = `INSERT INTO likes SET ?`;
    try {
      let [result] = await db.query(sql, data);
      await db.query("COMMIT");
      return result.insertId;
    } catch (error) {
      console.log(error);
      return { error };
    }
  }

  static async deleteThumbsUp(userId, messageId) {
    let sql = `DELETE FROM likes WHERE user_id = ? AND message_id = ?`;
    try {
      let [result] = await db.query(sql, [userId, messageId]);
      await db.query("COMMIT");
      return true;
    } catch (error) {
      console.log(error);
      return { error };
    }
  }
};
