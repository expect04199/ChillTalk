const db = require("../../util/database");

module.exports = class User {
  static async save(name, email, password) {
    try {
      let sql = `
        INSERT INTO users SET ?
        `;
      let data = {
        name,
        email,
        password,
        online: true,
        last_login: Date.now(),
      };
      let [result] = await db.query(sql, data);
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
};
