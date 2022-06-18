const db = require("../../util/database");

module.exports = class Room {
  static async getDetail(roomId, userId) {
    let sql = `
    SELECT a.id, a.name as room_name, e.url as room_picture, b.mute, b.notification, 
    c.id as user_id, c.name as user_name, c.email as user_email, f.url as user_picture, 
    g.url as user_background, c.introduction as user_introduction, c.online as user_online,
    d.id as channel_id, d.name as channel_name 
    FROM rooms a
    INNER JOIN room_members b on a.id = b.room_id
    RIGHT JOIN users c on b.user_id = c.id
    INNER JOIN channels d on a.id = d.room_id
    INNER JOIN pictures e on a.picture = e.id 
    INNER JOIN pictures f on c.picture = f.id 
    INNER JOIN pictures g on c.background = g.id 
    WHERE a.id = ? 
    `;
    let [result] = await db.query(sql, [roomId, userId]);
    return result;
  }

  static async isExisted(roomId) {
    let sql = "SELECT * FROM rooms WHERE id = ?";
    let [result] = await db.query(sql, [roomId]);
    return result.length !== 0;
  }
};
