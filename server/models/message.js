const db = require("../../util/database");
const Util = require("../../util/util");
const MAXMAILCOUNT = 30;
const MSGINTERVAL = 3000;

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
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");

      // find which session message in
      const sql = `
      SELECT a.id, a.user_id, a.initial_time, a.session FROM messages a
      INNER JOIN (
        SELECT MAX(session) session FROM messages WHERE channel_id = ?
      ) b ON a.session = b.session WHERE a.channel_id = ?
      `;
      const [sessions] = await conn.query(sql, [message.channelId, message.channelId]);
      let session;
      if (sessions.length === 0) {
        session = 1;
      } else if (message.time < sessions[0].initial_time + MSGINTERVAL && message.userId === sessions[0].user_id) {
        session = sessions[0].session;
      } else {
        session = sessions[0].session + 1;
      }

      // insert message
      const msg = {
        user_id: message.userId,
        channel_id: message.channelId,
        initial_time: message.time,
        reply: message.reply,
        session,
      };
      const result = await conn.query("INSERT INTO messages SET ?", msg);
      const messageId = +result[0].insertId;

      // insert content
      const content = {
        message_id: messageId,
        type: message.type,
        description: message.description,
        time: message.time,
      };
      await conn.query("INSERT INTO message_contents SET ?", content);

      await conn.query("COMMIT");
      return messageId;
    } catch (error) {
      await conn.query("ROLLBACK");
    } finally {
      await conn.release();
    }
  }

  static async getBySessions(channelId, take, start) {
    let sql = `
    SELECT a.*, b.type, b.description, c.name user_name,
    d.source pic_src, d.type pic_type, d.image pic_img, d.preset, JSON_ARRAYAGG(e.user_id) likes, r.*
    FROM messages a
    LEFT JOIN message_contents b ON a.id = b.message_id
    INNER JOIN (SELECT max(id) id FROM message_contents GROUP BY message_id) b1 ON b.id = b1.id
    LEFT JOIN users c ON a.user_id = c.id
    LEFT JOIN pictures d ON c.id = d.source_id AND d.source = "user" AND d.type = "picture"
    LEFT JOIN likes e ON a.id = e.message_id
    LEFT JOIN (
      SELECT f.id reply_id, f.user_id reply_user_id, g.description reply_description, h.name reply_name,
      i.source reply_pic_src, i.type reply_pic_type, i.image reply_pic_img, i.preset reply_preset
      FROM messages f
      LEFT JOIN message_contents g ON f.id = g.message_id
      INNER JOIN (SELECT max(id) id FROM message_contents GROUP BY message_id) g1 ON g.id = g1.id
      LEFT JOIN users h ON f.user_id = h.id
      LEFT JOIN pictures i ON h.id = i.source_id AND i.source = "user" AND i.type = "picture"
    ) as r 
    ON a.reply = r.reply_id 
    INNER JOIN (
      SELECT session FROM messages WHERE channel_id = ? GROUP BY session ORDER BY session DESC LIMIT ? OFFSET ?
    ) z ON a.session = z.session
    WHERE 1=1 AND a.channel_id = ? GROUP BY a.id ORDER BY a.id DESC `;
    const constraints = [channelId, take, start, channelId];
    const [messages] = await db.query(sql, constraints);
    return messages.reverse();
  }

  static async update(messageId, type, description) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      const time = Date.now();
      const message = {
        message_id: messageId,
        type,
        description,
        time,
      };
      await conn.query(`INSERT INTO message_contents SET ?`, message);
      await conn.query(`UPDATE messages SET is_edited = 1 WHERE id = ?`, [messageId]);
      await conn.query("COMMIT");
      return true;
    } catch (error) {
      await conn.query("ROLLBACK");
      return { error };
    } finally {
      await conn.release();
    }
  }

  static async delete(id) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES=0;");
      await conn.query("DELETE FROM messages WHERE id = ?", [id]);
      await conn.query("DELETE FROM message_contents WHERE message_id = ?", [id]);
      await conn.query("SET SQL_SAFE_UPDATES=1;");
      await conn.query("COMMIT");
      return true;
    } catch (error) {
      await conn.query("ROLLBACK");
      return { error };
    } finally {
      await conn.release();
    }
  }

  static async pin(id) {
    const conn = await db.getConnection();
    try {
      await conn.query(`UPDATE messages SET pinned = 1 WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      return { error };
    } finally {
      await conn.release();
    }
  }

  static async unpin(id) {
    const conn = await db.getConnection();
    try {
      await conn.query(`UPDATE messages SET pinned = 0 WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      return { error };
    } finally {
      await conn.release();
    }
  }

  static async postLike(userId, messageId) {
    const conn = await db.getConnection();
    try {
      const data = {
        user_id: userId,
        message_id: messageId,
      };
      await conn.query(`INSERT INTO likes SET ?`, data);
      return true;
    } catch (error) {
      return { error };
    } finally {
      await conn.release();
    }
  }

  static async deleteLike(userId, messageId) {
    const conn = await db.getConnection();
    try {
      await conn.query("SET SQL_SAFE_UPDATES = 0");
      await conn.query(`DELETE FROM likes WHERE user_id = ? AND message_id = ?`, [userId, messageId]);
      await conn.query("SET SQL_SAFE_UPDATES = 1");
      return true;
    } catch (error) {
      return { error };
    } finally {
      await conn.release();
    }
  }

  static async read(userId, roomId, channelId, messageId) {
    let conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES = 0");

      const data = {
        user_id: userId,
        room_id: roomId,
        channel_id: channelId,
        message_id: messageId,
      };

      // -1 means see all messages
      if (messageId === -1) {
        const [result] = await conn.query("SELECT MAX(id) id FROM messages WHERE channel_id = ?", [channelId]);
        if (result.length === 0) {
          await conn.query("COMMIT");
          return;
        }
        data.message_id = result[0].id;
      }

      // insert seen message id record
      const sql = `SELECT * FROM user_read_status WHERE user_id = ? AND room_id = ? AND channel_id = ?`;
      const [record] = await conn.query(sql, [userId, roomId, channelId]);

      if (record.length === 0) {
        await conn.query(`INSERT INTO user_read_status SET ?`, data);
      } else {
        await conn.query(`UPDATE user_read_status SET message_id = ? WHERE user_id = ? AND room_id = ? AND channel_id = ?`, [data.message_id, userId, roomId, channelId]);
      }

      await conn.query("SET SQL_SAFE_UPDATES = 1");
      await conn.query("COMMIT");
      return true;
    } catch (error) {
      await conn.query("ROLLBACK");
      return { error };
    } finally {
      await conn.release();
    }
  }

  static async getMail(userId) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES = 0");

      // find channels user in
      let sql = `
      SELECT d.id 
      FROM users a
      INNER JOIN room_members b ON a.id = b.user_id
      INNER JOIN rooms c ON b.room_id = c.id
      INNER JOIN channels d ON c.id = d.room_id
      WHERE a.id = ?
    `;
      let [channels] = await conn.query(sql, [userId]);
      channels = channels.map((channel) => channel.id);

      let tempCount = 0;
      const messagesArr = [];
      for (let channelId of channels) {
        if (messagesArr.length >= MAXMAILCOUNT) break;
        tempCount++;
        // take all unread messages in channel
        let sql = `
        SELECT a.id, a.initial_time, b.type, b.description, c.id channel_id, c.name channel_name, 
        d.id room_id, d.name room_name, d.type room_type, e.id user_id, e.name user_name,
        f.source user_pic_src, f.type user_pic_type, f.image user_pic_img, f.preset user_preset,
        g.source room_pic_src, g.type room_pic_type, g.image room_pic_img, g.preset room_preset
        FROM messages a
        LEFT JOIN message_contents b ON a.id = b.message_id
        INNER JOIN (SELECT max(id) id FROM message_contents GROUP BY message_id) b1 ON b.id = b1.id
        LEFT JOIN channels c ON a.channel_id = c.id
        LEFT JOIN rooms d ON c.room_id = d.id
        LEFT JOIN users e ON a.user_id = e.id
        LEFT JOIN pictures f ON e.id = f.source_id AND f.source = "user" AND f.type = "picture"
        LEFT JOIN pictures g ON d.id = g.source_id AND g.source = "room" AND g.type = "picture"
        WHERE c.id = ? AND a.id > 
        (
          SELECT CASE WHEN EXISTS
          (select g.message_id from user_read_status g WHERE g.user_id = ? AND g.channel_id = ?) 
          THEN 
          (select g.message_id from user_read_status g WHERE g.user_id = ? AND g.channel_id = ?) 
          ELSE 0 
          END AS message_id
        )
        `;
        let [messages] = await conn.query(sql, [channelId, userId, channelId, userId, channelId]);
        messages.forEach((msg) => {
          const userPic = Util.getImage(msg.user_preset, msg.user_pic_src, msg.user_id, msg.user_pic_type, msg.user_pic_img);
          const roomPic = Util.getImage(msg.room_preset, msg.room_pic_src, msg.room_id, msg.room_pic_type, msg.room_pic_img);

          let message = {
            id: msg.id,
            type: msg.type,
            channel_id: msg.channel_id,
            channel_name: msg.channel_name,
            room_id: msg.room_id,
            room_name: msg.room_name,
            description: msg.description,
            time: msg.initial_time,
            user_id: msg.user_id,
            name: msg.user_name,
            user_picture: userPic,
            room_picture: roomPic,
          };

          if (msg.room_type === "private") {
            message.room_picture = userPic;
            message.channel_name = msg.user_name;
            delete message.room_name;
          }

          messagesArr.push(message);
        });

        // when messages are taken, record as read
        if (messages.length) {
          let lastMessage = messages[messages.length - 1];
          await this.read(userId, lastMessage.room_id, lastMessage.channel_id, lastMessage.id);
        }
      }
      let next_paging;
      if (tempCount < channels.length) {
        next_paging = true;
      }
      await conn.query("SET SQL_SAFE_UPDATES = 1");
      await conn.query("COMMIT");
      return { messages: messagesArr, next_paging };
    } catch (error) {
      console.log(error);
      await conn.query("ROLLBACK");
      return { error };
    } finally {
      await conn.release();
    }
  }

  static async getReadSession(channelId, userId) {
    const sql = `
    SELECT b.session 
    FROM user_read_status a
    INNER JOIN messages b ON a.message_id = b.id
    WHERE a.channel_id = ? AND a.user_id = ?
    `;
    const [result] = await db.query(sql, [channelId, userId]);
    return result.length ? result[0].session : null;
  }

  static async getReverseOrder(channelId, readSession) {
    const sql = `
    SELECT a.ranks FROM (
      SELECT session, RANK() OVER (ORDER BY session DESC) ranks
      FROM messages WHERE channel_id = ? GROUP BY session
    ) a WHERE a.session = ?
    `;
    const [result] = await db.query(sql, [channelId, readSession]);
    return result[0].ranks;
  }
};
