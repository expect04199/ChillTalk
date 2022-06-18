const router = require("express").Router();
const userController = require("../controllers/user");

router.post("/user/join-room", userController.postJoinRoom);

module.exports = router;
