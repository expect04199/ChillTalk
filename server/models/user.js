const db = require("../../util/database");

module.exports = class User {
  static async joinRoom(roomId, userId) {
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
};
