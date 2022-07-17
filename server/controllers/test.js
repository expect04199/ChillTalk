const Message = require("../models/message");

module.exports.postMsgs = async (req, res) => {
  let time = 1658040736655;
  for (let i = 0; i < 1000; i++) {
    time += 700;
    let msg = {
      userId: 5,
      type: "text",
      channelId: "1",
      description: i.toString(),
      time: time,
      name: "Ron",
      picture: "https://d28ad0xxqchuot.cloudfront.net/user/5/picture/1658039669138",
    };
    await Message.save(msg);
  }
  return res.status(200).json({ msg: "done" });
};
