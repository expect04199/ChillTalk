const db = require("../../util/database");

module.exports = class Friend {
  static async addFriend(hostId, userId) {
    try {
      let existSql = `
      SELECT id From users WHERE id = ?
    `;
      let [exist] = await db.query(existSql, userId);
      if (!exist.length) {
        throw new Error();
      }

      let isFriendSql = `
      SELECT id FROM friends WHERE user_id = ? AND friend_id = ?
      `;
      let [isFriend] = await db.query(isFriendSql, [hostId, userId]);
      if (isFriend.length) {
        throw new Error();
      }

      let sql = `
      INSERT INTO friends(user_id, friend_id, status) VALUES ?
    `;
      let data = [
        [
          [hostId, userId, "sending"],
          [userId, hostId, "receiving"],
        ],
      ];
      await db.query(sql, data);
      return true;
    } catch (error) {
      console.log(error);
      return { error };
    }
  }
};
