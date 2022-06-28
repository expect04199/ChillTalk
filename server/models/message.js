const db = require("../../util/database");
const Util = require("../../util/util");
const PAGESIZE = 5;

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
      let sessionSql = `
      SELECT a.id, a.user_id, a.initial_time, a.session FROM messages a
      INNER JOIN (
        SELECT MAX(session) session FROM messages WHERE channel_id = ?
      ) b ON a.session = b.session WHERE a.channel_id = ?
      `;
      let [sessions] = await db.query(sessionSql, [message.channelId, message.channelId]);
      if (sessions.length === 0) {
        msg.session = 1;
      } else if (
        msg.initial_time < sessions[0].initial_time + 3000 &&
        msg.user_id === sessions[0].user_id
      ) {
        msg.session = sessions[0].session;
      } else {
        msg.session = sessions[0].session + 1;
      }
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
    LEFT JOIN (
      SELECT f.id reply_id, f.user_id reply_user_id, g.description reply_description, h.name reply_name,
      i.source reply_pic_src, i.type reply_pic_type, i.image reply_pic_img, i.preset reply_preset
      FROM chilltalk.messages f
      LEFT JOIN chilltalk.message_contents g ON f.id = g.message_id
      INNER JOIN (SELECT max(id) id FROM chilltalk.message_contents GROUP BY message_id) g1 ON g.id = g1.id
      LEFT JOIN chilltalk.users h ON f.user_id = h.id
      LEFT JOIN chilltalk.pictures i ON h.id = i.source_id AND i.source = "user" AND i.type = "picture"
    ) as r 
    ON a.reply = r.reply_id 
    LEFT JOIN (
      SELECT session FROM chilltalk.messages WHERE channel_id = 1 GROUP BY session ORDER BY session DESC LIMIT ? OFFSET ?
    ) z ON a.session = z.session
    WHERE 1=1 `;
    const constraints = [];
    let takeCount;
    let startCount;
    let readSql = `
    SELECT b.session 
    FROM user_read_status a
    INNER JOIN messages b ON a.message_id = b.id
    WHERE a.channel_id = ? AND a.user_id = ?
    `;
    let readId;
    if (userId) {
      const [read] = await db.query(readSql, [channelId, userId]);
      readId = read.length ? read[0].session : undefined;
    }

    if (userId && readId) {
      let orderSql = `
          SELECT b.ranks FROM 
          (
            SELECT a.session, RANK() OVER (ORDER BY a.session DESC) ranks
            FROM chilltalk.messages a WHERE a.channel_id = ? GROUP BY a.session
          ) b WHERE b.session = ?
        `;
      const [result] = await db.query(orderSql, [channelId, readId]);
      let order = result[0].ranks;
      paging = Math.ceil(order / PAGESIZE);
      takeCount = PAGESIZE * 3 + 1;
      startCount = paging < 2 ? 0 : (paging - 2) * PAGESIZE;
    } else {
      takeCount = PAGESIZE + 1;
      startCount = (paging - 1) * PAGESIZE;
    }
    constraints.push(takeCount, startCount);

    if (channelId) {
      sql += "AND a.channel_id = ? ";
      constraints.push(channelId);
    }
    sql += "GROUP BY a.id ORDER BY a.id DESC ";

    let [result] = await db.query(sql, constraints);
    result = result.reverse();
    let resultSessions = [];
    result.forEach((r) => {
      if (!resultSessions.includes(r.session)) {
        resultSessions.push(r.session);
      }
    });
    let next_paging;
    let prev_paging;
    if (userId && readId) {
      if (resultSessions.length > PAGESIZE * 3) {
        next_paging = paging === 1 ? paging + 3 : paging + 2;
        result = result.filter((r) => r.session > result[0].session);
      }
      if (paging > 2) {
        prev_paging = paging - 2;
      }
    } else {
      if (resultSessions.length > PAGESIZE) {
        next_paging = paging + 1;
        result = result.filter((r) => r.session > result[0].session);
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
        session: msg.session,
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
    return { read_session: readId, messages, next_paging, prev_paging };
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

  static async getMail(userId) {
    try {
      await db.query("START TRANSACTION");
      let channelSql = `
      SELECT d.id 
      FROM chilltalk.users a
      INNER JOIN chilltalk.room_members b ON a.id = b.user_id
      INNER JOIN chilltalk.rooms c ON b.room_id = c.id
      INNER JOIN chilltalk.channels d ON c.id = d.room_id
      WHERE a.id = ?
    `;

      let [channels] = await db.query(channelSql, [userId]);

      channels = channels.map((channel) => channel.id);
      let tempCount = 0;
      const messagesArr = [];
      for (let channelId of channels) {
        if (messagesArr.length >= 10) break;
        tempCount++;
        let sql = `
        SELECT a.id, a.initial_time, b.type, b.description, c.id channel_id, c.name channel_name, 
        d.id room_id, d.name room_name, e.id user_id, e.name user_name,
        f.source user_pic_src, f.type user_pic_type, f.image user_pic_img, f.preset user_preset,
        g.source room_pic_src, g.type room_pic_type, g.image room_pic_img, g.preset room_preset
        FROM chilltalk.messages a
        LEFT JOIN chilltalk.message_contents b ON a.id = b.message_id
        INNER JOIN (SELECT max(id) id FROM chilltalk.message_contents GROUP BY message_id) b1 ON b.id = b1.id
        LEFT JOIN chilltalk.channels c ON a.channel_id = c.id
        LEFT JOIN chilltalk.rooms d ON c.room_id = d.id
        LEFT JOIN chilltalk.users e ON a.user_id = e.id
        LEFT JOIN chilltalk.pictures f ON e.id = f.source_id AND f.source = "user" AND f.type = "picture"
        LEFT JOIN chilltalk.pictures g ON d.id = g.source_id AND g.source = "room" AND g.type = "picture"
        WHERE c.id = ? AND a.id > 
        (
          SELECT CASE WHEN EXISTS
          (select g.message_id from chilltalk.user_read_status g WHERE g.user_id = ? AND g.channel_id = ?) 
          THEN 
          (select g.message_id from chilltalk.user_read_status g WHERE g.user_id = ? AND g.channel_id = ?) 
          ELSE 0 
          END AS message_id
        )
        `;
        let [messages] = await db.query(sql, [channelId, userId, channelId, userId, channelId]);
        messages.forEach((msg) => {
          const userPic = Util.getImage(
            msg.user_preset,
            msg.user_pic_src,
            msg.user_id,
            msg.user_pic_type,
            msg.user_pic_img
          );
          const roomPic = Util.getImage(
            msg.room_preset,
            msg.room_pic_src,
            msg.room_id,
            msg.room_pic_type,
            msg.room_pic_img
          );
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
          messagesArr.push(message);
        });

        if (messages.length) {
          let lastMessage = messages[messages.length - 1];
          let readSql = `
          UPDATE user_read_status SET message_id = ? 
          WHERE user_id = ? AND channel_id = ?
          `;
          await db.query(readSql, [lastMessage.id, userId, channelId]);
        }
      }
      let next_paging;
      if (tempCount < channels.length) {
        next_paging = true;
      }
      await db.query("COMMIT");
      return { messages: messagesArr, next_paging };
    } catch (error) {
      console.log(error);
      await db.query("ROLLBACK");
      return { error };
    }
  }
};
