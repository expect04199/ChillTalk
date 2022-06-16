require("dotenv").config();
const Room = require("../models/room");

module.exports.getDetail = async (req, res) => {
  const roomId = req.query.roomId;
  let data = {
    id: roomId,
    name: "Test Room",
    picture:
      "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
    isMute: true,
    notification: "all",
    channels: [
      {
        id: 1234567,
        name: "校方公告",
      },
      {
        id: 1234567,
        name: "校方公告",
      },
      {
        id: 1234567,
        name: "校方公告",
      },
      {
        id: 1234567,
        name: "校方公告",
      },
      {
        id: 1234567,
        name: "校方公告",
      },
      {
        id: 1234567,
        name: "校方公告",
      },
    ],
    members: [
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: false,
      },
      {
        id: 123456789,
        name: "Test",
        email: "test123@test.com",
        picture:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        background:
          "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
        introduction: "This is a test account.",
        online: true,
      },
    ],
  };
  return res.json(data);
};
