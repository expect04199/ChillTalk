const db = require("../../util/database");

module.exports = class Channel {
  static async getDetail(channelId) {
    let sql = `
    SELECT a.id, a.channel_type, a.name as channel_name, b.user_id, c.description, 
    c.time, c.message_id, c.type as message_type, d.name as user_name, e.url
    FROM channels a
    LEFT JOIN messages b on a.id = b.channel_id
    LEFT JOIN message_contents c on b.id = c.message_id
    LEFT JOIN users d on b.user_id = d.id
    LEFT JOIN pictures e on d.picture = e.id
    WHERE a.id = ?
    `;
    let [result] = await db.query(sql, [channelId]);
    return result;
  }

  static async save(type, name, roomId) {
    let sql = `
    INSERT INTO channels SET ?
    `;
    let data = {
      channel_type: type,
      name,
      room_id: roomId,
    };
    let [result] = await db.query(sql, data);
    return result.insertId;
  }
};
