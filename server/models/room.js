module.exports = class Room {
  constructor(id, name, picture, host_id) {
    this.id = id;
    this.name = name;
    this.picture = picture;
    this.host_id = host_id;
  }

  static getInfo() {
    return "Hi";
  }
};
