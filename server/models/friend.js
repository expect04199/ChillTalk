const db = require("../../util/database");
const Util = require("../../util/util");
const Room = require("../models/room");
const Channel = require("../models/channel");
module.exports = class Friend {
  static async addFriend(hostId, userId) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      // check if user exist
      let existSql = `
      SELECT id From users WHERE id = ?
    `;
      let [exist] = await conn.query(existSql, userId);
      if (!exist.length) {
        await conn.query("COMMIT");
        return { error: "User does not exist", status: 400 };
      }

      let isFriendSql = `
      SELECT id FROM friends WHERE user_id = ? AND friend_id = ?
      `;
      let [isFriend] = await conn.query(isFriendSql, [hostId, userId]);
      if (isFriend.length) {
        await conn.query("COMMIT");
        return { error: "Already be friend", status: 400 };
      }

      let sql = `
      INSERT INTO friends(user_id, friend_id, status) VALUES ?
    `;
      let data = [
        [
          [hostId, userId, "sending"],
          [userId, hostId, "receiving"],
        ],
      ];
      await conn.query(sql, data);
      await conn.query("COMMIT");
      return true;
    } catch (error) {
      console.log(error);
      await conn.query("ROLLBACK");
    } finally {
      await conn.release();
    }
  }

  static async getRequests(hostId) {
    let sql = `
    SELECT b.id, b.name, b.online,
    c.source pic_src, c.type pic_type, c.image pic_img, c.preset
    FROM chilltalk.friends a
    INNER JOIN chilltalk.users b ON a.friend_id = b.id
    INNER JOIN chilltalk.pictures c ON c.source_id = b.id AND c.source = "user" AND c.type = "picture"
    WHERE a.user_id = ? AND a.status = "receiving"
    `;

    let [userData] = await db.query(sql, [hostId]);
    let users = [];
    userData.forEach((data) => {
      let userPic = Util.getImage(data.preset, data.pic_src, data.id, data.pic_type, data.pic_img);
      let user = {
        id: data.id,
        name: data.name,
        picture: userPic,
        online: data.online,
      };
      users.push(user);
    });
    return users;
  }

  static async deleteRequest(hostId, userId) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES = 0");
      let receiveSql = `
      DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = "receiving"
      `;
      await conn.query(receiveSql, [hostId, userId]);
      let requestSql = `
      DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = "sending"
      `;
      await conn.query(requestSql, [userId, hostId]);
      await conn.query("SET SQL_SAFE_UPDATES = 1");
      await conn.query("COMMIT");
      return true;
    } catch (error) {
      console.log(error);
      await conn.query("ROLLBACK");
      return { error };
    } finally {
      conn.release();
    }
  }

  static async acceptRequest(hostId, userId) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES = 0");
      const roomName = `${hostId}/${userId}`;
      let roomId = await Room.create([], roomName, hostId, "private");
      await Room.join(roomId, userId);
      const channelName = `${hostId}/${userId}`;
      let channelId = await Channel.save("text", channelName, roomId);
      let acceptSql = `
      UPDATE friends SET status = "OK", room_id = ?, channel_id = ? WHERE user_id = ? AND friend_id = ?
      `;
      await conn.query(acceptSql, [roomId, channelId, hostId, userId]);
      await conn.query(acceptSql, [roomId, channelId, userId, hostId]);
      await conn.query("SET SQL_SAFE_UPDATES = 1");
      await conn.query("COMMIT");
      return { room_id: roomId, channel_id: channelId };
    } catch (error) {
      console.log(error);
      await conn.query("ROLLBACK");
      return { error };
    } finally {
      await conn.release();
    }
  }

  static async getFriends(hostId) {
    let sql = `
    SELECT a.room_id,a.channel_id c_id, b.*,
    c.source pic_src, c.type pic_type, c.image pic_img, c.preset, d.*
    FROM chilltalk.friends a
    INNER JOIN chilltalk.users b ON a.friend_id = b.id
    INNER JOIN chilltalk.pictures c ON c.source_id = b.id AND c.source = "user" AND c.type = "picture"
    LEFT JOIN (
    SELECT channel_id, initial_time FROM chilltalk.messages a
    INNER JOIN (SELECT max(id) id FROM chilltalk.messages GROUP BY channel_id) a1 ON a.id = a1.id
    ) d ON a.channel_id = d.channel_id 
    WHERE a.user_id = ? AND a.status = "OK" ORDER BY d.initial_time DESC
    `;
    let [result] = await db.query(sql, [hostId]);
    let friends = result.map((data) => {
      let friendPic = Util.getImage(
        data.preset,
        data.pic_src,
        data.id,
        data.pic_type,
        data.pic_img
      );
      let friend = {
        id: data.id,
        name: data.name,
        online: data.online,
        picture: friendPic,
        last_message_time: data.initial_time,
        room_id: data.room_id,
        channel_id: data.c_id,
      };
      return friend;
    });
    return friends;
  }
};
