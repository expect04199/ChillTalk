const db = require("../../util/database");
const Util = require("../../util/util");
const { CDN_IP } = process.env;
const PRESET_PICTURE = "dogee.png";
const PRESET_BACKGROUND = "sunset.jpg";

module.exports = class Room {
  static async getDetail(roomId, userId) {
    let sql = `
    SELECT a.id, a.name,
    c.source AS pic_src, c.type AS pic_type, c.image AS pic_img, c.preset
    FROM rooms a 
    INNER JOIN room_members b ON a.id = b.room_id
    INNER JOIN pictures c ON a.id = c.source_id AND c.source = "room" AND c.type = "picture"
    WHERE a.id = ? AND b.user_id = ?
    `;
    let [result] = await db.query(sql, [roomId, userId]);
    let room = result[0];
    let roomPic = room.preset
      ? `${CDN_IP}/preset/1/${room.pic_type}/${room.pic_img}`
      : `${CDN_IP}/${room.pic_src}/${room.id}/${room.pic_type}/${room.pic_img}`;
    let data = {
      id: room.id,
      name: room.name,
      picture: roomPic,
    };
    return data;
  }

  static async getChannels(roomId) {
    let sql = `
    SELECT id, type, name FROM channels WHERE room_id = ?
    `;
    let [channels] = await db.query(sql, [roomId]);
    return channels;
  }
  static async getMembers(roomId) {
    let sql = `
    SELECT b.id, b.name, b.email, b.introduction, b.online,
    c.source AS pic_src, c.type AS pic_type, c.image AS pic_img, c.preset AS pic_preset,
    d.source AS bgd_src, d.type AS bgd_type, d.image AS bgd_img, d.preset AS bgd_preset
    FROM room_members a
    INNER JOIN users b ON a.user_id = b.id
    INNER JOIN pictures c ON b.id = c.source_id AND c.source = "user" AND c.type = "picture"
    INNER JOIN pictures d ON b.id = d.source_id AND d.source = "user" AND d.type = "background"
    WHERE a.room_id = ?
    `;
    let [members] = await db.query(sql, [roomId]);
    members = members.map((member) => {
      let userPic = member.pic_preset
        ? `${CDN_IP}/preset/1/${member.pic_type}/${member.pic_img}`
        : `${CDN_IP}/${member.pic_src}/${member.id}/${member.pic_type}/${member.pic_img}`;
      let userBgd = member.bgd_preset
        ? `${CDN_IP}/preset/1/${member.bgd_type}/${member.bgd_img}`
        : `${CDN_IP}/${member.bgd_src}/${member.id}/${member.bgd_type}/${member.bgd_img}`;
      let user = {
        id: member.id,
        name: member.name,
        email: member.email,
        introduction: member.introduction,
        online: member.online,
        picture: userPic,
        background: userBgd,
      };
      return user;
    });
    return members;
  }

  static async isExisted(roomId) {
    let sql = "SELECT * FROM rooms WHERE id = ?";
    let [rooms] = await db.query(sql, [roomId]);
    return rooms.length !== 0;
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

  static async create(files, roomName, userId) {
    try {
      // create room
      await db.query("START TRANSACTION");
      let roomSql = `
        INSERT INTO rooms SET ?
      `;
      let room = {
        name: roomName,
        host_id: userId,
      };
      let [result] = await db.query(roomSql, room);
      // create membership
      let memberSql = `
        INSERT INTO room_members SET ?
      `;
      let member = {
        room_id: result.insertId,
        user_id: userId,
        mute: Date.now(),
        notification: "all",
      };

      await db.query(memberSql, member);
      // upload picture
      let picSql = `INSERT INTO pictures SET ?`;
      let picData;
      if (files[0]) {
        picData = {
          source: "room",
          source_id: result.insertId,
          type: "picture",
          image: files[0].originalname,
          storage_type: "original",
          preset: 0,
        };
        await Util.imageUpload(files, "room", result.insertId, "picture");
      } else {
        picData = {
          source: "room",
          source_id: result.insertId,
          type: "picture",
          image: PRESET_PICTURE,
          storage_type: "original",
          preset: 1,
        };
      }
      await db.query(picSql, picData);
      await db.query("COMMIT");
      return result.insertId;
    } catch (error) {
      await db.query("ROLLBACK");
      console.log(error);
      return { error };
    }
  }

  static async search(content, roomId, fromUser, channelName, pinned) {
    let sql = `
    SELECT  a.id, a.channel_id, a.initial_time, b.type, b.description, c.id AS user_id, c.name AS user_name,
    d.source AS pic_src, d.type AS pic_type, d.image AS pic_img, d.preset
    FROM chilltalk.messages a
    LEFT JOIN chilltalk.message_contents b ON a.id = b.message_id
    INNER JOIN (SELECT max(id) id FROM chilltalk.message_contents GROUP BY message_id) b1 ON b.id = b1.id
    LEFT JOIN chilltalk.users c ON a.user_id = c.id
    LEFT JOIN chilltalk.pictures d ON c.id = d.source_id AND d.source = "user" AND d.type = "picture"
    LEFT JOIN chilltalk.channels e ON a.channel_id = e.id WHERE e.room_id = ? `;
    let constraints = [roomId];

    if (content) {
      sql += "AND b.description LIKE ? ";
      constraints.push(`%${content}%`);
    }

    if (fromUser) {
      sql += "AND c.name = ? ";
      constraints.push(fromUser);
    }

    if (channelName) {
      sql += "AND e.name = ? ";
      constraints.push(channelName);
    }

    if (pinned === "true") {
      sql += "AND a.pinned = 1";
    }

    let [result] = await db.query(sql, constraints);
    let messages = [];
    result.forEach((data) => {
      let userPic = data.preset
        ? `${CDN_IP}/preset/1/${data.pic_type}/${data.pic_img}`
        : `${CDN_IP}/${data.pic_src}/${data.user_id}/${data.pic_type}/${data.pic_img}`;
      let message = {
        id: data.id,
        type: data.type,
        channel_id: data.channel_id,
        description: data.description,
        time: data.initial_time,
        user_id: data.user_id,
        name: data.user_name,
        picture: userPic,
      };
      messages.push(message);
    });
    return messages;
  }
};
