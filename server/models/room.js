const db = require("../../util/database");
const Util = require("../../util/util");
const { CDN_IP } = process.env;
const PRESET_PICTURE = "dogee.png";

module.exports = class Room {
  static async getDetail(roomId, userId) {
    const sql = `
    SELECT a.id, a.name, a.host_id,
    c.source AS pic_src, c.type AS pic_type, c.image AS pic_img, c.preset
    FROM rooms a 
    INNER JOIN room_members b ON a.id = b.room_id
    INNER JOIN pictures c ON a.id = c.source_id AND c.source = "room" AND c.type = "picture"
    WHERE a.id = ? AND b.user_id = ?
    `;
    const [result] = await db.query(sql, [roomId, userId]);
    const room = result[0];
    const roomPic = Util.getImage(room.preset, room.pic_src, room.id, room.pic_type, room.pic_img);
    const data = {
      id: room.id,
      name: room.name,
      picture: roomPic,
      host_id: room.host_id,
    };
    return data;
  }

  static async getChannels(roomId) {
    const [channels] = await db.query(`SELECT id, type, name FROM channels WHERE room_id = ?`, [roomId]);
    return channels;
  }

  static async getMembers(roomId) {
    const sql = `
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
      const memberPic = Util.getImage(member.pic_preset, member.pic_src, member.id, member.pic_type, member.pic_img);
      const memberBgd = Util.getImage(member.bgd_preset, member.bgd_src, member.id, member.bgd_type, member.bgd_img);
      const user = {
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
    const [rooms] = await db.query("SELECT * FROM rooms WHERE id = ?", [roomId]);
    return rooms.length !== 0;
  }

  static async join(roomId, userId) {
    const conn = await db.getConnection();
    try {
      const [isJoin] = await conn.query(`SELECT id FROM room_members WHERE room_id = ? AND user_id = ?`, [roomId, userId]);
      if (isJoin.length) {
        return { error: "You have joined the room", status: 403 };
      }
      const data = {
        room_id: roomId,
        user_id: userId,
      };
      await conn.query(`INSERT INTO room_members SET ?`, data);
      return true;
    } catch (error) {
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
      const room = {
        name: roomName,
        host_id: userId,
        type,
      };
      const [roomResult] = await conn.query("INSERT INTO rooms SET ?", room);
      const roomId = roomResult.insertId;

      // create membership
      const member = {
        room_id: roomId,
        user_id: userId,
      };
      await conn.query("INSERT INTO room_members SET ?", member);

      // upload picture
      let picData;
      if (files[0]) {
        const picName = Date.now();
        picData = {
          source: "room",
          source_id: roomId,
          type: "picture",
          image: picName,
          preset: 0,
        };
        await Util.imageUpload(files, "room", roomId, "picture", picName);
      } else {
        picData = {
          source: "room",
          source_id: roomId,
          type: "picture",
          image: PRESET_PICTURE,
          preset: 1,
        };
      }
      await conn.query("INSERT INTO pictures SET ?", picData);
      await conn.query("COMMIT");
      return { roomId };
    } catch (error) {
      await conn.query("ROLLBACK");
      return { error: "Can not create new room", status: 500 };
    } finally {
      await conn.release();
    }
  }

  static async search(content, roomId, fromUser, channelName, pinned) {
    let sql = `
    SELECT a.id, a.channel_id, a.initial_time, b.type, b.description, c.id user_id, c.name user_name,
    d.source pic_src, d.type pic_type, d.image pic_img, d.preset
    FROM messages a
    LEFT JOIN message_contents b ON a.id = b.message_id
    INNER JOIN (SELECT max(id) id FROM message_contents GROUP BY message_id) b1 ON b.id = b1.id
    LEFT JOIN users c ON a.user_id = c.id
    LEFT JOIN pictures d ON c.id = d.source_id AND d.source = "user" AND d.type = "picture"
    LEFT JOIN channels e ON a.channel_id = e.id WHERE e.room_id = ? `;
    const constraints = [roomId];

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

    const [messages] = await db.query(sql, constraints);
    return messages;
  }

  static async update(id, name, files, userId) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES=0;");

      if (name) {
        const [result] = await conn.query("UPDATE rooms SET name = ? WHERE id = ? AND host_id = ?", [name, id, userId]);
        if (result.affectedRows === 0) {
          throw "error";
        }
      }

      let pic;
      if (files.length) {
        const fileName = Date.now();
        const fileSql = `
        UPDATE pictures a 
        INNER JOIN rooms b ON a.source_id = b.id AND a.source = "room" AND a.type = "picture"
        SET a.image = ?, a.preset = 0 WHERE b.id = ? AND b.host_id = ?;
        `;

        const [result] = await conn.query(fileSql, [fileName, id, userId]);
        if (result.affectedRows === 0) {
          throw "error";
        }
        pic = Util.getImage(0, "room", id, "picture", fileName);
        Util.imageUpload(files, "room", id, "picture", fileName);
      }

      const data = {
        id,
        name,
        picture: pic,
      };

      await conn.query("SET SQL_SAFE_UPDATES=1;");
      await conn.query("COMMIT");
      return data;
    } catch (error) {
      await conn.query("ROLLBACK");
      return { error: "Can not update room info.", status: 500 };
    } finally {
      await conn.release();
    }
  }
};
