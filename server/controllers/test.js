const Message = require("../models/message");

module.exports.postMsgs = async (req, res) => {
  let time = 1657788775760;
  for (let i = 0; i < 2000; i++) {
    time += 700;
    let msg = {
      userId: 1,
      type: "text",
      channelId: "28",
      description: i.toString(),
      time: time,
      name: "Harry",
      picture: "https://d28ad0xxqchuot.cloudfront.net/user/1/picture/1657449479361",
    };
    await Message.save(msg);
  }
  return res.status(200).json({ msg: "done" });
};
