const router = require("express").Router();
const roomController = require("../controllers/room");

router.get("/room", roomController.getRoom);

module.exports = router;
