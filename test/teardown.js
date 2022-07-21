const { closeConnection } = require("./test_util");
const { requester } = require("./set_up");

after(async () => {
  await closeConnection();
  requester.close();
});
