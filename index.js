const { io, server } = require("./util/socket");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const { SERVER_PORT, NODE_ENV, REDIS_NAME, REDIS_PORT } = process.env;

if (NODE_ENV === "production") {
  // connect to redis adapter
  const pubClient = createClient({ url: `redis://${REDIS_NAME}:${REDIS_PORT}` });
  const subClient = pubClient.duplicate();

  (async function () {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    server.listen(SERVER_PORT, () => {
      console.log("Server Connected.");
    });
  })();
} else {
  server.listen(SERVER_PORT, () => {
    console.log("Server Connected.");
  });
}
