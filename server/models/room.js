const db = require("../../util/database");
const Util = require("../../util/util");
const { CDN_IP } = process.env;
const PRESET_PICTURE = "dogee.png";

module.exports = class Room {
  static async getDetail(roomId, userId) {
    let sql = `
    SELECT a.id, a.name, a.host_id,
    c.source AS pic_src, c.type AS pic_type, c.image AS pic_img, c.preset
    FROM rooms a 
    INNER JOIN room_members b ON a.id = b.room_id
    INNER JOIN pictures c ON a.id = c.source_id AND c.source = "room" AND c.type = "picture"
    WHERE a.id = ? AND b.user_id = ?
    `;
    let [result] = await db.query(sql, [roomId, userId]);
    let room = result[0];
    const roomPic = Util.getImage(room.preset, room.pic_src, room.id, room.pic_type, room.pic_img);
    let data = {
      id: room.id,
      name: room.name,
      picture: roomPic,
      host_id: room.host_id,
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
      const memberPic = Util.getImage(
        member.pic_preset,
        member.pic_src,
        member.id,
        member.pic_type,
        member.pic_img
      );

      const memberBgd = Util.getImage(
        member.bgd_preset,
        member.bgd_src,
        member.id,
        member.bgd_type,
        member.bgd_img
      );

      let user = {
        id: member.id,
        name: member.name,
        email: member.email,
        introduction: member.introduction,
        online: member.online,
        picture: memberPic,
        background: memberBgd,
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
    const conn = await db.getConnection();
    try {
      let existSql = `SELECT id FROM room_members WHERE room_id = ? AND user_id = ?`;
      let [isExist] = await conn.query(existSql, [roomId, userId]);
      if (isExist.length) {
        return { error: "You have joined the room", status: 403 };
      }
      let sql = `INSERT INTO room_members SET ?`;
      let data = {
        room_id: roomId,
        user_id: userId,
      };
      await conn.query(sql, data);
      return true;
    } catch (error) {
      console.log(error);
      return { error: "Can not join room.", status: 500 };
    } finally {
      await conn.release();
    }
  }

  static async create(files, roomName, userId, type) {
    const conn = await db.getConnection();
    try {
      // create room
      await conn.query("START TRANSACTION");
      let roomSql = `
        INSERT INTO rooms SET ?
      `;
      let room = {
        name: roomName,
        host_id: userId,
        type,
      };
      let [roomResult] = await conn.query(roomSql, room);
      const roomId = roomResult.insertId;
      // create membership
      let memberSql = `
        INSERT INTO room_members SET ?
      `;
      let member = {
        room_id: roomId,
        user_id: userId,
      };
      await conn.query(memberSql, member);

      // upload picture
      let picSql = `INSERT INTO pictures SET ?`;
      let picData;
      if (files[0]) {
        let picName = Date.now();
        picData = {
          source: "room",
          source_id: roomId,
          type: "picture",
          image: picName,
          storage_type: "original",
          preset: 0,
        };
        await Util.imageUpload(files, "room", roomId, "picture", picName);
      } else {
        picData = {
          source: "room",
          source_id: roomId,
          type: "picture",
          image: PRESET_PICTURE,
          storage_type: "original",
          preset: 1,
        };
      }
      await conn.query(picSql, picData);
      await conn.query("COMMIT");
      return roomId;
    } catch (error) {
      await conn.query("ROLLBACK");
      console.log(error);
      return { error: "Can not create new room", status: 500 };
    } finally {
      await conn.release();
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
      sql += "AND b.description LIKE BINARY(?) ";
      constraints.push(`%${content}%`);
    }

    if (fromUser) {
      sql += "AND c.name = BINARY(?) ";
      constraints.push(fromUser);
    }

    if (channelName) {
      sql += "AND e.name = BINARY(?) ";
      constraints.push(channelName);
    }

    if (pinned === "true") {
      sql += "AND a.pinned = 1";
    }

    let [result] = await db.query(sql, constraints);
    let messages = [];
    result.forEach((data) => {
      const userPic = Util.getImage(
        data.preset,
        data.pic_src,
        data.user_id,
        data.pic_type,
        data.pic_img
      );
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

  static async update(id, name, files, userId) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES=0;");
      if (name) {
        let nameSql = `
          UPDATE rooms SET name = ? WHERE id = ? AND host_id = ?
        `;
        let [result] = await conn.query(nameSql, [name, id, userId]);
        if (result.affectedRows === 0) {
          throw new Error("Room does not exist.");
        }
      }

      let pic;
      if (files.length) {
        let fileSql = `
        UPDATE pictures a 
        INNER JOIN rooms b ON a.source_id = b.id AND a.source = "room" AND a.type = "picture"
        SET a.image = ?, a.preset = 0 WHERE b.id = ? AND b.host_id = ?;
        `;
        let fileName = Date.now();
        let [result] = await conn.query(fileSql, [fileName, id, userId]);

        if (result.affectedRows === 0) {
          throw new Error("File does not exist.");
        }
        pic = Util.getImage(0, "room", id, "picture", fileName);
        Util.imageUpload(files, "room", id, "picture", fileName);
      }
      let data = {
        id,
        name,
        picture: pic,
      };
      await conn.query("SET SQL_SAFE_UPDATES=1;");
      await conn.query("COMMIT");
      return data;
    } catch (error) {
      console.log(error);
      await conn.query("ROLLBACK");
      return { error };
    } finally {
      await conn.release();
    }
  }
};
