const users = [
  {
    name: "Harry",
    email: "test123@test.com",
    password: "test1234",
    introduction: "No content",
    online: 1,
    last_login: Date.now(),
  },
];

const pictures = [
  {
    source: "user",
    source_id: 1,
    type: "picture",
    image: "dogee.png",
    preset: 1,
  },
  {
    source: "user",
    source_id: 1,
    type: "background",
    image: "sunset.jpg",
    preset: 1,
  },
];

module.exports = {
  users,
  pictures,
};
