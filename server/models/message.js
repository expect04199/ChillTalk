const db = require("../../util/database");
const Util = require("../../util/util");
const PAGESIZE = 20;

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

  static async get(channelId, paging = 1, userId) {
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
    let takeCount;
    let startCount;
    if (userId) {
      let readSql = "SELECT message_id FROM user_read_status WHERE channel_id = ? AND user_id = ?";
      const [read] = await db.query(readSql, [channelId, userId]);
      const readId = read[0].message_id;
      if (readId) {
        let orderSql = `
        SELECT b.ranks FROM 
        (
        SELECT a.id, RANK() OVER (ORDER BY a.id DESC) ranks
        FROM chilltalk.messages a WHERE a.channel_id = ?
        ) b WHERE b.id = ?
        `;
        const [result] = await db.query(orderSql, [channelId, readId]);
        let order = result[0].ranks;
        paging = Math.ceil(order / PAGESIZE);
        takeCount = PAGESIZE * 3 + 1;
        startCount = paging < 2 ? 0 : (paging - 2) * PAGESIZE;
      }
    } else {
      takeCount = PAGESIZE + 1;
      startCount = (paging - 1) * PAGESIZE;
    }
    sql += "ORDER BY a.id DESC LIMIT ? OFFSET ?";
    contraints.push(takeCount, startCount);
    let [result] = await db.query(sql, contraints);
    result = result.reverse();

    let next_paging;
    let prev_paging;
    if (userId) {
      if (result.length > PAGESIZE * 3) {
        next_paging = paging === 1 ? paging + 3 : paging + 2;
        result.shift();
      }
      if (paging > 2) {
        prev_paging = paging - 2;
      }
    } else {
      if (result.length > PAGESIZE) {
        next_paging = paging + 1;
        result.shift();
      }
      if (paging !== 1) {
        prev_paging = paging - 1;
      }
    }

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
        pinned: msg.pinned,
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
          msg.reply_pic_img
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
    return { messages, next_paging, prev_paging };
  }

  static async update(id, type, description) {
    try {
      await db.query("START TRANSACTION");
      let insertSql = `INSERT INTO message_contents SET ?`;
      let time = Date.now();
      let message = {
        message_id: id,
        type,
        description,
        time,
      };
      await db.query(insertSql, message);

      let updateSql = `UPDATE messages SET is_edited = 1 WHERE id = ?`;
      await db.query(updateSql, [id]);
      await db.query("COMMIT");
      return true;
    } catch (error) {
      await db.query("ROLLBACK");
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

  static async read(userId, roomId, channelId, messageId) {
    try {
      await db.query("START TRANSACTION");

      let data = {
        user_id: userId,
        room_id: roomId,
        channel_id: channelId,
        message_id: messageId,
      };
      if (messageId === -1) {
        let [result] = await db.query("SELECT MAX(id) id FROM messages WHERE channel_id = ?", [
          channelId,
        ]);
        if (result.length === 0) {
          await db.query("COMMIT");
          return;
        }
        data.message_id = result[0].id;
      }
      let recordSql = `SELECT * FROM user_read_status WHERE user_id = ? AND room_id = ? AND channel_id = ?`;
      let [record] = await db.query(recordSql, [userId, roomId, channelId]);
      if (record.length === 0) {
        let sql = `INSERT INTO user_read_status SET ?`;
        await db.query(sql, data);
      } else {
        let sql = `UPDATE user_read_status SET message_id = ? WHERE user_id = ? AND room_id = ? AND channel_id = ?`;
        await db.query(sql, [data.message_id, userId, roomId, channelId]);
      }
      await db.query("COMMIT");
      return true;
    } catch (error) {
      console.log(error);
      await db.query("ROLLBACK");
      return { error };
    }
  }
};
