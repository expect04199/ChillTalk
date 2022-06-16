const router = require("express").Router();
const roomController = require("../controllers/room");

router.get("/rooms/details", roomController.getDetail);

module.exports = router;
