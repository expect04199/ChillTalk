const router = require("express").Router();
const roomController = require("../controllers/room");

router.get("/rooms/details", roomController.getDetail);

router.post("/rooms/join", roomController.postJoinRoom);

router.post("/rooms/create", roomController.postCreateRoom);

module.exports = router;
