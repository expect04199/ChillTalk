const router = require("express").Router();
const channelController = require("../controllers/channel");

router.get("/channels/details", channelController.getDetail);

router.post("/channel/create", channelController.createChannel);

module.exports = router;
