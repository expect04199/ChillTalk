const db = require("../../util/database");
const bcrypt = require("bcryptjs");

const { CDN_IP } = process.env;
const PRESET_PICTURE = "doge.png";
const PRESET_BACKGROUND = "portal-to-another-world-1024×768.jpg";
const PRESET_INTRODUCTION = "No content";

module.exports = class User {
  static async signin(email, password) {
    try {
      await db.query("START TRANSACTION");
      let sql = `
      SELECT a.*, b.source AS pic_src, b.type AS pic_type, b.image AS pic_img, b.preset AS pic_preset,
      c.source AS bgd_src, c.type AS bgd_type, c.image AS bgd_img, c.preset AS bgd_preset
      FROM users a 
      LEFT JOIN pictures b ON a.id = b.source_id AND b.source = "user" AND b.type = "picture"
      LEFT JOIN pictures c ON a.id = c.source_id AND c.source = "user" AND c.type = "background"
      WHERE a.email = ?
      `;
      let [result] = await db.query(sql, [email]);
      let user = result[0];
      if (!bcrypt.compareSync(password, user.password)) {
        await db.query("COMMIT");
        return { error: "Password is wrong", status: 403 };
      }
      let lastLogin = Date.now();
      let updateSql = `UPDATE users SET online = ?, last_login = ?`;
      await db.query(updateSql, [1, lastLogin]);
      await db.query("COMMIT");
      console.log(typeof user.pic_preset);
      let userPicture = user.pic_preset
        ? `${CDN_IP}/preset/1/${user.pic_type}/${user.pic_img}`
        : `${CDN_IP}/${user.pic_src}/${user.id}/${user.pic_type}/${user.pic_img}`;
      let userBackground = user.bgd_preset
        ? `${CDN_IP}/preset/1/${user.bgd_type}/${user.bgd_img}`
        : `${CDN_IP}/${user.bgd_src}/${user.id}/${user.bgd_type}/${user.bgd_img}`;

      let info = {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: userPicture,
        background: userBackground,
        introduction: user.introduction,
        online: true,
        last_login: lastLogin,
      };
      return info;
    } catch (error) {
      console.log(error);
      await db.query("ROLLBACK");
      return { error };
    }
  }

  static async signup(name, email, password) {
    try {
      await db.query("START TRANSACTION");
      // save user
      let userSql = `
        INSERT INTO users SET ?
        `;
      let userData = {
        name,
        email,
        password,
        introduction: PRESET_INTRODUCTION,
        online: 1,
        last_login: Date.now(),
      };
      let [user] = await db.query(userSql, userData);

      // save picture
      let picSql = `INSERT INTO pictures(source, source_id, type, image, storage_type, preset) VALUES ?`;
      let picData = {
        source: "user",
        source_id: user.insertId,
        type: "picture",
        image: PRESET_PICTURE,
        storage_type: "original",
        preset: 1,
      };
      let bgdData = {
        source: "user",
        source_id: user.insertId,
        type: "background",
        image: PRESET_BACKGROUND,
        storage_type: "original",
        preset: 1,
      };
      await db.query(picSql, [[Object.values(picData), Object.values(bgdData)]]);

      delete userData.password;
      userData.picture = `${CDN_IP}/preset/1/${picData.type}/${picData.image}`;
      userData.background = `${CDN_IP}/preset/1/${bgdData.type}/${bgdData.image}`;
      userData.id = user.insertId;
      await db.query("COMMIT");
      return userData;
    } catch (error) {
      console.log(error);
      await db.query("ROLLBACK");
      return {
        error: "Email Already Exists",
        status: 403,
      };
    }
  }

  static async findRooms(userId) {
    let sql = `
    SELECT b.id, b.name, b.host_id, c.id AS channel_id,
    d.source AS pic_src, d.type AS pic_type, d.image AS pic_img, d.preset
    FROM room_members a 
    INNER JOIN rooms b ON a.room_id = b.id
    LEFT JOIN channels c ON b.id = c.room_id
    LEFT JOIN pictures d ON b.id = d.source_id AND d.source = "room" AND d.type = "picture"
    WHERE a.user_id = ?
    ORDER BY b.id, channel_id
    `;
    let [rooms] = await db.query(sql, [userId]);
    let roomMap = {};
    rooms.forEach((room) => {
      if (!roomMap[room.id]) {
        let roomPicture = room.preset
          ? `${CDN_IP}/preset/1/${room.pic_type}/${room.pic_img}`
          : `${CDN_IP}/${room.pic_src}/${room.id}/${room.pic_type}/${room.pic_img}`;
        let data = {
          id: room.id,
          name: room.name,
          picture: roomPicture,
          host_id: room.host_id,
          alert: true,
        };
        if (room.channel_id) {
          data.channel_id = room.channel_id;
        }
        roomMap[room.id] = data;
      }
    });
    return Object.values(roomMap);
  }
};
