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
      const [user] = await conn.query(`SELECT id FROM users WHERE id = ?`, userId);
      if (!user.length) {
        await conn.query("COMMIT");
        return { error: "User does not exist", status: 403 };
      }

      // check if users haven't be friend
      const [friendStatus] = await conn.query(`SELECT status FROM friends WHERE user_id = ? AND friend_id = ?`, [hostId, userId]);
      if (friendStatus.length) {
        await conn.query("COMMIT");
        const status = friendStatus[0].status;
        switch (status) {
          case "receiving":
            return { error: "User has already sent request to you.", status: 403 };
          case "sending":
            return { error: "You have already sent request to the user.", status: 403 };
          case "OK":
            return { error: "You have already be friend.", status: 403 };
          default:
            return { error: "Unable to send friend request.", status: 500 };
        }
      }

      const data = [
        [
          [hostId, userId, "sending"],
          [userId, hostId, "receiving"],
        ],
      ];
      await conn.query(`INSERT INTO friends(user_id, friend_id, status) VALUES ?`, data);
      await conn.query("COMMIT");
      return true;
    } catch (error) {
      await conn.query("ROLLBACK");
      console.log(error);
      return { error: "Unable to send friend request.", status: 500 };
    } finally {
      await conn.release();
    }
  }

  static async getRequests(hostId) {
    const sql = `
    SELECT b.id, b.name, b.online,
    c.source pic_src, c.type pic_type, c.image pic_img, c.preset
    FROM friends a
    INNER JOIN users b ON a.friend_id = b.id
    INNER JOIN pictures c ON c.source_id = b.id AND c.source = "user" AND c.type = "picture"
    WHERE a.user_id = ? AND a.status = "receiving"
    `;
    const [users] = await db.query(sql, [hostId]);
    return users;
  }

  static async deleteRequest(hostId, userId) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES = 0");

      const receiveSql = `DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = "receiving"`;
      await conn.query(receiveSql, [hostId, userId]);

      const requestSql = `DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = "sending"`;
      await conn.query(requestSql, [userId, hostId]);

      await conn.query("SET SQL_SAFE_UPDATES = 1");
      await conn.query("COMMIT");
      return true;
    } catch (error) {
      await conn.query("ROLLBACK");
      return { error: "Can not delete friend request", status: 500 };
    } finally {
      conn.release();
    }
  }

  static async acceptRequest(hostId, userId) {
    const conn = await db.getConnection();
    try {
      await conn.query("START TRANSACTION");
      await conn.query("SET SQL_SAFE_UPDATES = 0");

      // create a new room for private chat
      const roomName = `${hostId}/${userId}`;
      const roomData = await Room.create([], roomName, hostId, "private");
      if (roomData.error) {
        throw "error";
      }
      const roomId = roomData.roomId;
      await Room.join(roomId, userId);

      // create a new channel for private chat
      const channelName = `${hostId}/${userId}`;
      const channelData = await Channel.save("text", channelName, roomId, hostId);
      if (channelData.error) {
        throw "error";
      }
      const channelId = channelData.id;

      const sql = `UPDATE friends SET status = "OK", room_id = ?, channel_id = ? WHERE user_id = ? AND friend_id = ?`;
      await conn.query(sql, [roomId, channelId, hostId, userId]);
      await conn.query(sql, [roomId, channelId, userId, hostId]);

      await conn.query("SET SQL_SAFE_UPDATES = 1");
      await conn.query("COMMIT");
      return { room_id: roomId, channel_id: channelId };
    } catch (error) {
      await conn.query("ROLLBACK");
      console.log(error);
      return { error: "Can not accept request.", status: 500 };
    } finally {
      await conn.release();
    }
  }

  static async getFriends(hostId) {
    const sql = `
    SELECT a.room_id, a.channel_id, b.*,
    c.source pic_src, c.type pic_type, c.image pic_img, c.preset pic_preset, d.*
    FROM friends a
    INNER JOIN users b ON a.friend_id = b.id
    INNER JOIN pictures c ON c.source_id = b.id AND c.source = "user" AND c.type = "picture"
    LEFT JOIN (
    SELECT channel_id c_id, initial_time FROM messages a
    INNER JOIN (SELECT max(id) id FROM messages GROUP BY channel_id) a1 ON a.id = a1.id
    ) d ON a.channel_id = d.c_id 
    WHERE a.user_id = ? AND a.status = "OK" ORDER BY d.initial_time DESC
    `;

    const [friends] = await db.query(sql, [hostId]);
    return friends;
  }
};
