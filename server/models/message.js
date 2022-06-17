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

  static async isExist(id) {
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
        last_update: message.time,
        is_deleted: 0,
      };
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
};
