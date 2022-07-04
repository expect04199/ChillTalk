const db = require("../../util/database");

module.exports = class Stream {
  static async save(channelId, userId, socketId) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES=0");
      let existSql = `
        SELECT id FROM stream_members WHERE channel_id = ? AND user_id = ?
        `;
      let [exist] = await conn.query(existSql, [channelId, userId]);
      if (exist.length) {
        let sql = `
        UPDATE stream_members SET socket_id = ? WHERE user_id = ? AND channel_id = ?
        `;
        await conn.query(sql, [socketId, userId, channelId]);

        await conn.query("COMMIT");
        return;
      }
      let data = {
        channel_id: channelId,
        user_id: userId,
        socket_id: socketId,
      };
      let sql = `
        INSERT INTO stream_members SET ?
        `;
      await conn.query(sql, data);
      await conn.query("SET SQL_SAFE_UPDATES=1");
      await conn.query("COMMIT");
      return;
    } catch (error) {
      await conn.query("ROLLBACK");
      console.log(error);
    }
  }

  static async delete(socketId) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES=0;");
      let selectSql = `
      SELECT * FROM chilltalk.stream_members
      WHERE channel_id in (
        SELECT channel_id FROM chilltalk.stream_members WHERE socket_id = ?
      )
        `;
      let [result] = await conn.query(selectSql, [socketId]);
      let deleteSql = `
      DELETE FROM stream_members WHERE socket_id = ?
      `;
      await conn.query(deleteSql, [socketId]);
      let sockets = result.map((d) => d.socket_id);
      let userId = result.find((r) => r.socket_id === socketId).user_id;
      await conn.query("SET SQL_SAFE_UPDATES=1;");
      await conn.query("COMMIT");
      return { sockets, userId };
    } catch (error) {
      await conn.query("ROLLBACK");
      console.log(error);
    }
  }
};
