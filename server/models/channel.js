const db = require("../../util/database");

module.exports = class Channel {
  static async getPinMessages(channelId) {
    const sql = `
    SELECT a.id, a.name, a.type, b.id msg_id, b.reply_id msg_reply, b.pinned msg_pinned, 
    c.type msg_type, c.description msg_desc, c.time msg_time, 
    d.id user_id, d.name user_name,
    e.source pic_src, e.type pic_type, e.image pic_img, e.preset pic_preset
    FROM channels a
    LEFT JOIN messages b ON a.id = b.channel_id
    LEFT JOIN message_contents c ON b.id = c.message_id
    LEFT JOIN users d ON b.user_id = d.id
    LEFT JOIN pictures e ON d.id = e.source_id AND e.source = "user" AND e.type = "picture"
    WHERE a.id = ? AND b.pinned = 1 GROUP BY b.id 
    `;

    const [messages] = await db.query(sql, [channelId]);
    return messages;
  }

  static async save(type, name, roomId, userId) {
    const conn = await db.getConnection();
    try {
      // check if user is in the room
      const [status] = await conn.query("SELECT * FROM room_members WHERE room_id = ? AND user_id = ?", [roomId, userId]);
      if (!status.length) {
        return { error: "Can not create channel", status: 500 };
      }

      const data = {
        type,
        name,
        room_id: roomId,
      };
      const [result] = await conn.query(`INSERT INTO channels SET ?`, data);
      return { id: result.insertId };
    } catch (error) {
      return { error: "Can not create channel", status: 500 };
    } finally {
      await conn.release();
    }
  }
};
