module.exports.getDetail = async (req, res) => {
  let channelId = req.query.channelId;
  let data = {
    id: channelId,
    name: "Test channel",
    type: "text",
    messages: [
      {
        id: 12345,
        name: "Carl Lin",
        time: 1655357505298,
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        description: "Test1",
      },
      {
        id: 12345,
        name: "Carl Lin",
        time: 1655367505298,
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        description: "Test2",
      },
      {
        id: 12345,
        name: "Carl Lin",
        time: 1655377505298,
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        description: "Test3",
      },
    ],
  };
  return res.json(data);
};
