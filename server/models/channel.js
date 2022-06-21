const db = require("../../util/database");

const { CDN_IP } = process.env;

module.exports = class Channel {
  static async getDetail(channelId) {
    let sql = `
    SELECT a.id, a.name, a.type, b.id AS message_id, c.type AS message_type, c.description AS message_description, c.time, 
    d.id AS user_id, d.name AS user_name,
    e.source AS pic_src, e.type AS pic_type, e.image AS pic_img, e.preset
    FROM channels a
    LEFT JOIN chilltalk.messages b on a.id = b.channel_id
    LEFT JOIN chilltalk.message_contents c on b.id = c.message_id
    LEFT JOIN chilltalk.users d on b.user_id = d.id
    LEFT JOIN chilltalk.pictures e on d.id = e.source_id AND e.source = "user" AND e.type = "picture"
    WHERE a.id = ?
    `;
    let [details] = await db.query(sql, [channelId]);
    let messages = [];
    details.forEach((detail) => {
      let userPic = detail.preset
        ? `${CDN_IP}/preset/1/${detail.pic_type}/${detail.pic_img}`
        : `${CDN_IP}/${detail.pic_src}/${detail.user_id}/${detail.pic_type}/${detail.pic_img}`;
      if (!detail.message_id) return;
      let message = {
        id: detail.message_id,
        type: detail.message_type,
        channel_id: detail.id,
        description: detail.message_description,
        time: detail.time,
        user_id: detail.user_id,
        name: detail.user_name,
        picture: userPic,
      };
      messages.push(message);
    });

    let channelDetail = {
      id: details[0].id,
      name: details[0].name,
      channel_type: details[0].type,
      messages,
    };
    return channelDetail;
  }

  static async save(type, name, roomId) {
    let sql = `
    INSERT INTO channels SET ?
    `;
    let data = {
      type,
      name,
      room_id: roomId,
    };
    let [result] = await db.query(sql, data);
    return result.insertId;
  }
};
