const db = require("../../util/database");
const bcrypt = require("bcryptjs");
const Util = require("../../util/util");

const { CDN_IP } = process.env;
const PRESET_PICTURE = "dogee.png";
const PRESET_BACKGROUND = "sunset.jpg";
const PRESET_INTRODUCTION = "No content";
module.exports = class User {
  static async signin(email, password) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      // check if user exist
      const sql = `
      SELECT a.*, b.source AS pic_src, b.type AS pic_type, b.image AS pic_img, b.preset AS pic_preset,
      c.source AS bgd_src, c.type AS bgd_type, c.image AS bgd_img, c.preset AS bgd_preset
      FROM users a 
      LEFT JOIN pictures b ON a.id = b.source_id AND b.source = "user" AND b.type = "picture"
      LEFT JOIN pictures c ON a.id = c.source_id AND c.source = "user" AND c.type = "background"
      WHERE a.email = ?
      `;
      const [users] = await conn.query(sql, [email]);
      const user = users[0];
      if (!user || !bcrypt.compareSync(password, user.password)) {
        await conn.query("COMMIT");
        return { error: "Wrong email or password", status: 403 };
      }

      // update user status
      const lastLogin = Date.now();
      const updateSql = `UPDATE users SET online = ?, last_login = ? WHERE id = ?`;
      await conn.query(updateSql, [1, lastLogin, user.id]);
      await conn.query("COMMIT");

      const userPic = Util.getImage(user.pic_preset, user.pic_src, user.id, user.pic_type, user.pic_img);
      const userBgd = Util.getImage(user.bgd_preset, user.bgd_src, user.id, user.bgd_type, user.bgd_img);

      const info = {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: userPic,
        background: userBgd,
        introduction: user.introduction,
        online: true,
        last_login: lastLogin,
      };
      return info;
    } catch (error) {
      await conn.query("ROLLBACK");
      return { error: "Can not sign in", status: 500 };
    } finally {
      await conn.release();
    }
  }

  static async signup(name, email, password) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      const lastLogin = Date.now();
      // save user
      const info = {
        name,
        email,
        password,
        introduction: PRESET_INTRODUCTION,
        online: 1,
        last_login: lastLogin,
      };
      const [user] = await conn.query("INSERT INTO users SET ?", info);

      // save picture
      const sql = `INSERT INTO pictures(source, source_id, type, image, preset) VALUES ?`;
      const picData = {
        source: "user",
        source_id: user.insertId,
        type: "picture",
        image: PRESET_PICTURE,
        preset: 1,
      };
      const bgdData = {
        source: "user",
        source_id: user.insertId,
        type: "background",
        image: PRESET_BACKGROUND,
        preset: 1,
      };
      await conn.query(sql, [[Object.values(picData), Object.values(bgdData)]]);
      delete info.password;
      info.picture = `${CDN_IP}/preset/1/${picData.type}/${picData.image}`;
      info.background = `${CDN_IP}/preset/1/${bgdData.type}/${bgdData.image}`;
      info.id = user.insertId;

      await conn.query("COMMIT");
      return info;
    } catch (error) {
      await conn.query("ROLLBACK");
      return {
        error: "Email Already Exists",
        status: 403,
      };
    }
  }

  static async findRooms(userId, type) {
    const sql = `
    SELECT b.id, b.name, b.host_id, c.id channel_id,
    d.source pic_src, d.type pic_type, d.image pic_img, d.preset
    FROM room_members a 
    INNER JOIN rooms b ON a.room_id = b.id
    LEFT JOIN channels c ON b.id = c.room_id
    LEFT JOIN pictures d ON b.id = d.source_id AND d.source = "room" AND d.type = "picture"
    WHERE a.user_id = ? AND b.type = ?
    ORDER BY b.id, channel_id
    `;
    const [rooms] = await db.query(sql, [userId, type]);
    const roomMap = {};
    rooms.forEach((r) => {
      if (!roomMap[r.id]) {
        const roomPic = Util.getImage(r.preset, r.pic_src, r.id, r.pic_type, r.pic_img);
        const room = {
          id: r.id,
          name: r.name,
          picture: roomPic,
          host_id: r.host_id,
        };
        roomMap[room.id] = room;
      }
    });
    return Object.values(roomMap);
  }

  static async online(userId) {
    await db.query(`UPDATE users SET online = 1, last_login = ? WHERE id = ?`, [Date.now(), userId]);
  }

  static async offline(userId) {
    await db.query(`UPDATE users SET online = 0 WHERE id = ?`, [userId]);
  }

  static async getInfo(userId) {
    const sql = `
    SELECT a.* ,
    b.source pic_src, b.type pic_type, b.image pic_img, b.preset pic_preset,
    c.source bgd_src, c.type bgd_type, c.image bgd_img, c.preset bgd_preset
    FROM users a
    INNER JOIN pictures b ON a.id = b.source_id AND b.source = "user" AND b.type = "picture"
    INNER JOIN pictures c ON a.id = c.source_id AND c.source = "user" AND c.type = "background"
    WHERE a.id = ?
    `;
    let [result] = await db.query(sql, userId);
    result = result[0];
    const userPic = Util.getImage(result.pic_preset, result.pic_src, result.id, result.pic_type, result.pic_img);
    const userBgd = Util.getImage(result.bgd_preset, result.bgd_src, result.id, result.bgd_type, result.bgd_img);
    const info = {
      id: result.id,
      name: result.name,
      picture: userPic,
      background: userBgd,
      introduction: result.introduction,
      online: result.online,
      last_login: result.last_login,
    };
    return info;
  }

  static async getRooms(hostId, userId) {
    const sql = `
    SELECT c.id, c.name ,
    d.source AS pic_src, d.type AS pic_type, d.image AS pic_img, d.preset pic_preset
    FROM
    (SELECT room_id FROM room_members WHERE user_id = ?) a
    INNER JOIN 
    (SELECT user_id, room_id FROM room_members WHERE user_id = ?) b
    ON a.room_id = b.room_id
    INNER JOIN rooms c ON b.room_id = c.id
    INNER JOIN pictures d ON c.id = d.source_id AND d.source = "room" AND d.type = "picture"
    WHERE c.type = "public"
    `;
    let [rooms] = await db.query(sql, [hostId, userId]);
    rooms = rooms.map((r) => {
      const roomPic = Util.getImage(r.pic_preset, r.pic_src, r.id, r.pic_type, r.pic_img);
      const room = {
        id: r.id,
        name: r.name,
        picture: roomPic,
      };
      return room;
    });

    return rooms;
  }

  static async getFriends(hostId, userId) {
    const sql = `
    SELECT c.id, c.name ,
    d.source pic_src, d.type pic_type, d.image pic_img, d.preset pic_preset
    FROM
    (SELECT friend_id FROM friends WHERE user_id = ?) a
    INNER JOIN 
    (SELECT friend_id FROM friends WHERE user_id = ?) b
    ON a.friend_id = b.friend_id
    INNER JOIN users c ON b.friend_id = c.id
    INNER JOIN pictures d ON c.id = d.source_id AND d.source = "user" AND d.type = "picture"
    `;
    let [friends] = await db.query(sql, [hostId, userId]);
    friends = friends.map((f) => {
      const friendPic = Util.getImage(f.pic_preset, f.pic_src, f.id, f.pic_type, f.pic_img);
      const friend = {
        id: f.id,
        name: f.name,
        picture: friendPic,
      };
      return friend;
    });
    return friends;
  }

  static async update(files, userId, name, introduction) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES=0;");
      // update info
      if (name || introduction) {
        await conn.query("UPDATE users SET name = ?, introduction = ? WHERE id = ?", [name, introduction, userId]);
      }

      // update picture
      let pic;
      if (files.picture) {
        const fileName = Date.now();
        Util.imageUpload(files.picture, "user", userId, "picture", fileName);
        pic = Util.getImage(0, "user", userId, "picture", fileName);
        const sql = `
        UPDATE pictures SET image = ?, preset = 0 WHERE source = "user" AND type = "picture" AND source_id = ?
        `;
        await conn.query(sql, [fileName, userId]);
      }

      // update background
      let bgd;
      if (files.background) {
        const fileName = Date.now();
        Util.imageUpload(files.background, "user", userId, "background", fileName);
        bgd = Util.getImage(0, "user", userId, "background", fileName);
        const sql = `
        UPDATE pictures SET image = ?, preset = 0 WHERE source = "user" AND type = "background" AND source_id = ?
        `;
        await conn.query(sql, [fileName, userId]);
      }

      const [user] = await conn.query("SELECT * FROM users WHERE id = ?", [userId]);
      const info = {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        picture: pic,
        background: bgd,
        introduction: user[0].introduction,
        online: true,
        last_login: user[0].last_login,
      };
      await conn.query("SET SQL_SAFE_UPDATES=1;");
      await conn.query("COMMIT");

      return info;
    } catch (error) {
      await conn.query("ROLLBACK");
      return { error: "Can not update user info", status: 403 };
    } finally {
      await conn.release();
    }
  }
};
