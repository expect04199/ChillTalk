require("dotenv").config();
const { NODE_ENV } = process.env;
const bcrypt = require("bcryptjs");
const { users, pictures } = require("./fake_data");
const db = require("../util/database");

async function _createFakeUser(conn) {
  const encryped_users = users.map((user) => {
    const salt = bcrypt.genSaltSync(10);
    const encryped_user = {
      name: user.name,
      email: user.email,
      password: bcrypt.hashSync(user.password, salt),
      introduction: user.introduction,
      online: user.online,
      last_login: user.last_login,
    };
    return encryped_user;
  });
  return await conn.query(
    "INSERT INTO users (name, email, password, introduction, online, last_login) VALUES ?",
    [encryped_users.map((x) => Object.values(x))]
  );
}

async function _createFakePicture(conn) {
  return await conn.query(
    "INSERT INTO pictures (source, source_id, type, image, preset) VALUES ?",
    [pictures.map((x) => Object.values(x))]
  );
}

async function createData() {
  if (NODE_ENV !== "test") {
    console.log("Not in test env");
    return;
  }
  const conn = await db.getConnection();
  await conn.query("START TRANSACTION");
  await conn.query("SET FOREIGN_KEY_CHECKS = ?", 0);
  await _createFakeUser(conn);
  await _createFakePicture(conn);
  await conn.query("SET FOREIGN_KEY_CHECKS = ?", 1);
  await conn.query("COMMIT");
  await conn.release();
}

async function truncateData() {
  if (NODE_ENV !== "test") {
    console.log("Not in test env");
    return;
  }

  const truncateTable = async (table) => {
    const conn = await db.getConnection();
    await conn.query("START TRANSACTION");
    await conn.query("SET FOREIGN_KEY_CHECKS = ?", 0);
    await conn.query(`TRUNCATE TABLE ${table}`);
    await conn.query("SET FOREIGN_KEY_CHECKS = ?", 1);
    await conn.query("COMMIT");
    await conn.release();
    return;
  };

  const tables = [
    "channels",
    "friends",
    "likes",
    "message_contents",
    "messages",
    "pictures",
    "room_members",
    "rooms",
    "stream_members",
    "user_read_status",
    "users",
  ];
  for (let table of tables) {
    await truncateTable(table);
  }

  return;
}

async function closeConnection() {
  return await db.end();
}

async function main() {
  await truncateData();
  await createData();
  await closeConnection();
}

// execute when called directly.
if (require.main === module) {
  main();
}

module.exports = {
  createData,
  truncateData,
  closeConnection,
};
