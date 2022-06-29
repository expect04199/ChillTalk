const db = require("../../util/database");
const bcrypt = require("bcryptjs");
const Util = require("../../util/util");

const { CDN_IP } = process.env;
const PRESET_PICTURE = "dogee.png";
const PRESET_BACKGROUND = "sunset.jpg";
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
    console.log(hostId, userId);
    let infoSql = `
    SELECT a.* ,
    b.source AS pic_src, b.type AS pic_type, b.image AS pic_img, b.preset pic_preset,
    c.source AS bgd_src, c.type AS bgd_type, c.image AS bgd_img, c.preset bgd_preset
    FROM chilltalk.users a
    INNER JOIN chilltalk.pictures b ON a.id = b.source_id AND b.source = "user" AND b.type = "picture"
    INNER JOIN chilltalk.pictures c ON a.id = c.source_id AND c.source = "user" AND c.type = "background"
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

    let roomSql = `
    SELECT c.id, c.name ,
    d.source AS pic_src, d.type AS pic_type, d.image AS pic_img, d.preset pic_preset
    FROM
    (SELECT room_id FROM chilltalk.room_members WHERE user_id = ?) a
    INNER JOIN 
    (SELECT user_id, room_id FROM chilltalk.room_members WHERE user_id = ?) b
    ON a.room_id = b.room_id
    INNER JOIN chilltalk.rooms c ON b.room_id = c.id
    INNER JOIN chilltalk.pictures d ON c.id = d.source_id AND d.source = "room" AND d.type = "picture"
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

    let friendSql = `
    SELECT c.id, c.name ,
    d.source AS pic_src, d.type AS pic_type, d.image AS pic_img, d.preset pic_preset
    FROM
    (SELECT friend_id FROM chilltalk.friends WHERE user_id = 1) a
    INNER JOIN 
    (SELECT user_id, friend_id FROM chilltalk.friends WHERE user_id = 2) b
    ON a.friend_id = b.friend_id
    INNER JOIN chilltalk.users c ON b.user_id = c.id
    INNER JOIN chilltalk.pictures d ON c.id = d.source_id AND d.source = "user" AND d.type = "picture"
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

    return { info, rooms, friends };
  }
};
