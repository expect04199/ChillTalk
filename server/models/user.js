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
      let sql = `
      SELECT a.*, b.source AS pic_src, b.type AS pic_type, b.image AS pic_img, b.preset AS pic_preset,
      c.source AS bgd_src, c.type AS bgd_type, c.image AS bgd_img, c.preset AS bgd_preset
      FROM users a 
      LEFT JOIN pictures b ON a.id = b.source_id AND b.source = "user" AND b.type = "picture"
      LEFT JOIN pictures c ON a.id = c.source_id AND c.source = "user" AND c.type = "background"
      WHERE a.email = ?
      `;
      let [users] = await conn.query(sql, [email]);
      let user = users[0];
      if (!user || !bcrypt.compareSync(password, user.password)) {
        await conn.query("COMMIT");
        return { error: "Wrong email or password", status: 403 };
      }

      // if (user.online === 1) {
      //   await conn.query("COMMIT");
      //   return { error: "User has already login", status: 403 };
      // }

      // update user status
      const lastLogin = Date.now();
      const updateSql = `UPDATE users SET online = ?, last_login = ? WHERE id = ?`;
      await conn.query(updateSql, [1, lastLogin, user.id]);
      await conn.query("COMMIT");

      const userPic = Util.getImage(
        user.pic_preset,
        user.pic_src,
        user.id,
        user.pic_type,
        user.pic_img
      );

      const userBgd = Util.getImage(
        user.bgd_preset,
        user.bgd_src,
        user.id,
        user.bgd_type,
        user.bgd_img
      );

      let info = {
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
      // console.log(error);
      await conn.query("ROLLBACK");
      return { error: "Can not sign in", status: 500 };
    } finally {
      await conn.release();
    }
  }

  static async signup(name, email, password) {
    let conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      const lastLogin = Date.now();
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
        last_login: lastLogin,
      };
      let [user] = await conn.query(userSql, userData);

      // save picture
      let picSql = `INSERT INTO pictures(source, source_id, type, image, preset) VALUES ?`;
      let picData = {
        source: "user",
        source_id: user.insertId,
        type: "picture",
        image: PRESET_PICTURE,
        preset: 1,
      };
      let bgdData = {
        source: "user",
        source_id: user.insertId,
        type: "background",
        image: PRESET_BACKGROUND,
        preset: 1,
      };
      await conn.query(picSql, [[Object.values(picData), Object.values(bgdData)]]);
      delete userData.password;
      userData.picture = `${CDN_IP}/preset/1/${picData.type}/${picData.image}`;
      userData.background = `${CDN_IP}/preset/1/${bgdData.type}/${bgdData.image}`;
      userData.id = user.insertId;
      await conn.query("COMMIT");
      return userData;
    } catch (error) {
      // console.log(error);
      await conn.query("ROLLBACK");
      return {
        error: "Email Already Exists",
        status: 403,
      };
    }
  }

  static async findRooms(userId, type) {
    let sql = `
    SELECT b.id, b.name, b.host_id, c.id AS channel_id,
    d.source AS pic_src, d.type AS pic_type, d.image AS pic_img, d.preset
    FROM room_members a 
    INNER JOIN rooms b ON a.room_id = b.id
    LEFT JOIN channels c ON b.id = c.room_id
    LEFT JOIN pictures d ON b.id = d.source_id AND d.source = "room" AND d.type = "picture"
    WHERE a.user_id = ? AND b.type = ?
    ORDER BY b.id, channel_id
    `;
    let [rooms] = await db.query(sql, [userId, type]);
    let roomMap = {};
    rooms.forEach((room) => {
      if (!roomMap[room.id]) {
        const roomPic = Util.getImage(
          room.preset,
          room.pic_src,
          room.id,
          room.pic_type,
          room.pic_img
        );
        let data = {
          id: room.id,
          name: room.name,
          picture: roomPic,
          host_id: room.host_id,
        };
        if (room.channel_id) {
          data.channel_id = room.channel_id;
        }
        roomMap[room.id] = data;
      }
    });
    return Object.values(roomMap);
  }

  static async online(userId) {
    let time = Date.now();
    let sql = `UPDATE users SET online = 1, last_login = ${time} WHERE id = ?`;
    await db.query(sql, [userId]);
  }

  static async offline(userId) {
    let sql = `UPDATE users SET online = 0 WHERE id = ?`;
    await db.query(sql, [userId]);
  }

  static async getInfo(hostId, userId) {
    let infoSql = `
    SELECT a.* ,
    b.source AS pic_src, b.type AS pic_type, b.image AS pic_img, b.preset pic_preset,
    c.source AS bgd_src, c.type AS bgd_type, c.image AS bgd_img, c.preset bgd_preset
    FROM users a
    INNER JOIN pictures b ON a.id = b.source_id AND b.source = "user" AND b.type = "picture"
    INNER JOIN pictures c ON a.id = c.source_id AND c.source = "user" AND c.type = "background"
    WHERE a.id = ?
    `;
    let [infos] = await db.query(infoSql, userId);
    const infoData = infos[0];
    const userPic = Util.getImage(
      infoData.pic_preset,
      infoData.pic_src,
      infoData.id,
      infoData.pic_type,
      infoData.pic_img
    );
    const userBgd = Util.getImage(
      infoData.bgd_preset,
      infoData.bgd_src,
      infoData.id,
      infoData.bgd_type,
      infoData.bgd_img
    );
    const info = {
      id: infoData.id,
      name: infoData.name,
      picture: userPic,
      background: userBgd,
      introduction: infoData.introduction,
      online: infoData.online,
      last_login: infoData.last_login,
    };
    return info;
  }

  static async getRooms(hostId, userId) {
    let roomSql = `
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
    const [roomsData] = await db.query(roomSql, [hostId, userId]);
    let rooms = [];
    roomsData.forEach((room) => {
      let roomPic = Util.getImage(
        room.pic_preset,
        room.pic_src,
        room.id,
        room.pic_type,
        room.pic_img
      );

      let roomData = {
        id: room.id,
        name: room.name,
        picture: roomPic,
      };
      rooms.push(roomData);
    });

    return rooms;
  }

  static async getFriends(hostId, userId) {
    let friendSql = `
    SELECT c.id, c.name ,
    d.source AS pic_src, d.type AS pic_type, d.image AS pic_img, d.preset pic_preset
    FROM
    (SELECT friend_id FROM friends WHERE user_id = ?) a
    INNER JOIN 
    (SELECT friend_id FROM friends WHERE user_id = ?) b
    ON a.friend_id = b.friend_id
    INNER JOIN users c ON b.friend_id = c.id
    INNER JOIN pictures d ON c.id = d.source_id AND d.source = "user" AND d.type = "picture"
    `;
    const [friendsData] = await db.query(friendSql, [hostId, userId]);
    let friends = [];
    friendsData.forEach((friend) => {
      let friendPic = Util.getImage(
        friend.pic_preset,
        friend.pic_src,
        friend.id,
        friend.pic_type,
        friend.pic_img
      );

      let friendData = {
        id: friend.id,
        name: friend.name,
        picture: friendPic,
      };
      friends.push(friendData);
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
        let infoSql = `
        UPDATE users SET name = ?, introduction = ? WHERE id = ?
        `;
        await conn.query(infoSql, [name, introduction, userId]);
      }

      // update picture
      let pic;
      if (files.picture) {
        const fileName = Date.now();
        Util.imageUpload(files.picture, "user", userId, "picture", fileName);
        let picSql = `
        UPDATE pictures SET image = ?, preset = 0 WHERE source = "user" AND type = "picture" AND source_id = ?
        `;
        await conn.query(picSql, [fileName, userId]);
        pic = Util.getImage(0, "user", userId, "picture", fileName);
      }

      // update background
      let bgd;
      if (files.background) {
        const fileName = Date.now();
        Util.imageUpload(files.background, "user", userId, "background", fileName);
        let bgdSql = `
        UPDATE pictures SET image = ?, preset = 0 WHERE source = "user" AND type = "background" AND source_id = ?
        `;
        await conn.query(bgdSql, [fileName, userId]);
        bgd = Util.getImage(0, "user", userId, "background", fileName);
      }

      let [user] = await conn.query("SELECT * FROM users WHERE id = ?", [userId]);
      let info = {
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
      // console.log(error);
      await conn.query("ROLLBACK");
      return { error: "Can not update user info", status: 403 };
    } finally {
      await conn.release();
    }
  }
};
