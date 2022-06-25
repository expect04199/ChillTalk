const db = require("../../util/database");

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
