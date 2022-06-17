const db = require("../../util/database");

module.exports = class Channel {
  static async getDetail(channelId) {
    let sql = `
    SELECT * FROM channels a
    INNER JOIN messages b on a.id = b.channel_id
    INNER JOIN message_contents c on b.id = c.message_id
    INNER JOIN users d on b.user_id = d.id
    INNER JOIN pictures e on d.picture = e.id
    WHERE a.id = ?
    `;
    let [result] = await db.query(sql, [channelId]);
    return result;
  }
};
