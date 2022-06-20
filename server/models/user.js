const db = require("../../util/database");
const bcrypt = require("bcryptjs");

const { CDN_IP } = process.env;
const PRESET_PICTURE_ID = 1;
const PRESET_BACKGROUND_ID = 2;
const PRESET_INTRODUCTION = "No content";
const PICTURE_PATH = CDN_IP + "/user";

module.exports = class User {
  static async signin(email, password) {
    try {
      await db.query("START TRANSACTION");
      let sql = `
      SELECT a.*, b.url as picture_url, c.url as background_url FROM users a 
      LEFT JOIN pictures b ON a.picture = b.id
      LEFT JOIN pictures c ON a.background = c.id
      WHERE a.email = ?
      `;
      let [result] = await db.query(sql, [email]);
      let user = result[0];
      if (!bcrypt.compareSync(password, user.password)) {
        await db.query("COMMIT");
        return { error: "Password is wrong" };
      }
      let lastLogin = Date.now();
      let updateSql = `UPDATE users SET online = ?, last_login = ?`;
      await db.query(updateSql, [1, lastLogin]);
      await db.query("COMMIT");

      user.last_login = lastLogin;
      user.online = 1;
      return user;
    } catch (error) {
      console.log(error);
      await db.query("ROLLBACK");
      return { error };
    }
  }

  static async signup(name, email, password) {
    try {
      let sql = `
        INSERT INTO users SET ?
        `;
      let data = {
        name,
        email,
        password,
        picture: PRESET_PICTURE_ID,
        background: PRESET_BACKGROUND_ID,
        introduction: PRESET_INTRODUCTION,
        online: 1,
        last_login: Date.now(),
      };
      let [result] = await db.query(sql, data);
      console.log(result);
      return;
      delete data.password;
      data.id = result.insertId;
      return data;
    } catch (error) {
      console.log(error);
      return {
        error: "Email Already Exists",
        status: 403,
      };
    }
  }

  static async findRooms(userId) {
    let sql = `
    SELECT a.*, c.id as channel_id, d.url as room_picture FROM rooms a 
    INNER JOIN room_members b ON a.id = b.room_id
    LEFT JOIN channels c ON a.id = c.room_id
    LEFT JOIN pictures d ON a.picture = d.id
    WHERE b.user_id = ?
    `;
    let [rooms] = await db.query(sql, [userId]);
    let roomMap = {};
    rooms.forEach((room) => {
      if (!roomMap[room.id]) {
        room.picture = room.room_picture;
        delete room.room_picture;
        roomMap[room.id] = room;
        if (!room.channel_id) {
          delete room.channel_id;
        }
      }
    });
    return Object.values(roomMap);
  }
};
