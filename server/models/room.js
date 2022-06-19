const db = require("../../util/database");

module.exports = class Room {
  static async getDetail(roomId) {
    let sql = `
    SELECT a.id, a.name as room_name, e.url as room_picture, b.mute, b.notification, 
    c.id as user_id, c.name as user_name, c.email as user_email, f.url as user_picture, 
    g.url as user_background, c.introduction as user_introduction, c.online as user_online,
    d.id as channel_id, d.name as channel_name 
    FROM rooms a
    LEFT JOIN room_members b on a.id = b.room_id
    LEFT JOIN users c on b.user_id = c.id
    LEFT JOIN channels d on a.id = d.room_id
    LEFT JOIN pictures e on a.picture = e.id 
    LEFT JOIN pictures f on c.picture = f.id 
    LEFT JOIN pictures g on c.background = g.id 
    WHERE a.id = ? 
    `;
    let [result] = await db.query(sql, [roomId]);
    return result;
  }

  static async isExisted(roomId) {
    let sql = "SELECT * FROM rooms WHERE id = ?";
    let [result] = await db.query(sql, [roomId]);
    return result.length !== 0;
  }

  static async join(roomId, userId) {
    let sql = `INSERT INTO room_members SET ?`;
    let data = {
      room_id: roomId,
      user_id: userId,
      mute: Date.now(),
      notification: "all",
    };
    let [result] = await db.query(sql, data);
    return result.insertId;
  }

  static async create(roomName, userId) {
    try {
      await db.query("START TRANSACTION");
      let roomSql = `
        INSERT INTO rooms SET ?
      `;
      let room = {
        name: roomName,
        picture: 1,
        host_id: userId,
      };
      let [result] = await db.query(roomSql, room);
      let roomId = result.insertId;
      let roomMemberSql = `
        INSERT INTO room_members SET ?
      `;
      let roomMember = {
        room_id: roomId,
        user_id: userId,
        mute: Date.now(),
        notification: "all",
      };
      await db.query(roomMemberSql, roomMember);
      await db.query("COMMIT");
      return roomId;
    } catch (error) {
      await db.query("ROLLBACK");
      console.log(error);
    }
  }
};
